const factory = require('./factory');
const utils = require('../utils.js');
const yahooStrategy = require('../strategies/yahoo')(utils, 'yahoo.com');
const googleStrategy = require('../strategies/google')(utils, 'google.com');
const githubStrategy = require('../strategies/github')(utils, 'github.com');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

describe('Test util functions', () => {
  describe('#hasSameDomain', () => {
    it('matches a domain with subdomain', () => {
      expect(utils.hasSameDomain('http://google.com','http://drive.google.com')).to.be.true;
    });
    it('matches another domain with subdomain', () => {
      expect(utils.hasSameDomain('https://sports.yahoo.com', 'https://www.yahoo.com/')).to.be.true;
    });
    it('matches https domain with http', () => {
      expect(utils.hasSameDomain('https://www.russianmachineneverbreaks.com/', 'http://www.russianmachineneverbreaks.com/')).to.be.true;
    });
  });

  describe('#getOriginOfUrl', () => {
      console.log(utils.getOriginOfUrl('http://google.com'));
      console.log(utils.getOriginOfUrl('http://drive.google.com'));
      console.log(utils.getOriginOfUrl('https://sports.yahoo.com'));
      console.log(utils.getOriginOfUrl('https://www.yahoo.com/'));
      console.log(utils.getOriginOfUrl('https://www.russianmachineneverbreaks.com/'));
      console.log(utils.getOriginOfUrl('http://www.russianmachineneverbreaks.com/'));
  });

  describe('#shouldIgnore', () => {

    var anchor;

    beforeEach(() => {
      anchor = factory.anchor();
    });

    describe('without a strategy', () => {
      it('returns true for an empty href', () => {
        anchor.setAttribute('href', '');
        expect(utils.shouldIgnore(anchor)).to.be.true;
      });
      it('returns true for an "#" href', () => {
        anchor.setAttribute('href', '#backers');
        expect(utils.shouldIgnore(anchor)).to.be.true;
      });
      it('returns true for absolute path with page anchor', () => {
        anchor.setAttribute('href', "https://mochajs.org/#backers");
        expect(utils.shouldIgnore(anchor)).to.be.true;
      });
      it('returns true for href with "javascript"', () => {
        anchor.setAttribute('href', 'javascript:void(0)');
        expect(utils.shouldIgnore(anchor)).to.be.true;
      });
      it('returns false for an absolute path', () => {
        anchor.setAttribute('href', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty');
        expect(utils.shouldIgnore(anchor)).to.be.false;
      });
      it('returns true for anchor with onclick attribute', () => {
        anchor.setAttribute('href', 'http://www.google.com/');
        anchor.setAttribute('onclick', function() {});
        expect(utils.shouldIgnore(anchor)).to.be.true;
      });
    });

    describe('with a strategy', () => {

      it('returns true if strategy.shouldIgnore() is true', () => {
        var strategy = factory.strategy(false,false,true);
        anchor.setAttribute('href', 'http://www.google.com/');
        expect(utils.shouldIgnore(anchor, strategy)).to.be.true;
      });

      it('returns false if strategy.shouldIgnore is false', () => {
        var strategy = factory.strategy(false,false,false);
        anchor.setAttribute('href', 'http://www.google.com/');
        expect(utils.shouldIgnore(anchor, strategy)).to.be.false;
      });
    });
  });

  describe('#determineAnchorType', () => {
    var anchor = factory.anchor();
    anchor.setAttribute('origin', 'http://drive.google.com')

    describe('without a strategy', () => {

      it('returns "relative" if anchor.origin and windowOrigin match', () => {
        expect(utils.determineAnchorType(anchor, 'http://google.com')).to.eq('relative');
      })
      it('returns "absolute" if anchor.origin and windowOrigin do not match', () => {
        expect(utils.determineAnchorType(anchor, 'https://www.yahoo.com/')).to.eq('absolute');
      })
    });

    describe('with a strategy', () => {
      it('returns "absolute" if strategy.shouldTreatAsAbsolute()', () => {
        let strategy = factory.strategy(false, true);
        expect(utils.determineAnchorType(anchor, 'http://google.com', strategy)).to.eq('absolute')
      });
      it('returns "relative" if strategy.shouldTreatAsRelative()', () => {
        let strategy = factory.strategy(true, false);
        expect(utils.determineAnchorType(anchor, 'http://google.com', strategy)).to.eq('relative')
      });
      it('returns "absolute" if both strategy.shouldTreatAsAbsolute() && strategy.shouldTreatAsRelative() are true', () => {
        let strategy = factory.strategy(true, true);
        expect(utils.determineAnchorType(anchor, 'http://google.com', strategy)).to.eq('absolute')
      });
      it('calls hasSameDomain() if both strategy.shouldTreatAsAbsolute() && strategy.shouldTreatAsRelative() are false', () => {
        let strategy = factory.strategy(false, false);
        let hasSameDomain = sinon.spy(utils, 'hasSameDomain');

        utils.determineAnchorType(anchor, 'http://google.com', strategy);
        expect(hasSameDomain).to.have.been.called;
        hasSameDomain.restore();
      });
    });
  });

  describe('#isSleepTimerEnabled(expirationTimeInMs, curTimerInMs)', () => {
    it('should return true if expirationTimeInMs > curTimerInMs', () => {
      expect(utils.isSleepTimerEnabled(Date.now() + 30, Date.now())).to.be.true;
    })
    it('should return false if expirationTimeInMs == curTimerInMs', () => {
      expect(utils.isSleepTimerEnabled(Date.now(), Date.now())).to.be.false;
    })
    it('should return false if expirationTimeInMs < curTimerInMs', () => {
      expect(utils.isSleepTimerEnabled(Date.now() - 30, Date.now())).to.be.false;
    })
  });

  describe('#keyHeldDuringClick', () => {
    let event;
    beforeEach(() => {
      event = factory.event();
    });

    it('should return "command" if event.metaKey is true', () => {
      event.metaKey = true;
      expect(utils.keyHeldDuringClick(event)).to.equal('command');
    })
    it('should return "alt" if event.altKey is true', () => {
      event.altKey = true;
      expect(utils.keyHeldDuringClick(event)).to.equal('alt');
    })
    it('should return an empty string otherwise', () => {
      expect(utils.keyHeldDuringClick(event)).to.equal('');
    })
    it('should return an empty string if both event.metaKey and event.altKey are true', () => {
      event.metaKey = true;
      event.altKey = true;
      expect(utils.keyHeldDuringClick(event)).to.equal('');
    })
  });
});
