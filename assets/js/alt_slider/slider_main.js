/**
 * Module to identify common browsers, operating systems
 * and hardware devices.
 *
 * Apple hardware detection based very heavily
 * on Alexandre Dieulot's iDevice,
 * which is released under the MIT license.
 * https://github.com/dieulot/idevice
 *
 * For iOS 12.2 and later GPU detection, this module relies
 * on Renderer (getRenderer), released under MPL v2.
 * https://github.com/51degrees/renderer
 *
 */
const userAgent =  window.navigator.userAgent ;
const cache = {};

const commonOperatingSystems = [
  ['iOS', /iP(hone|od|ad)/i],
  ['Android', /Android/i],
  ['BlackBerry OS', /BlackBerry|BB10/i],
  ['Windows Mobile', /IEMobile/i],
  ['Fire OS', /Kindle Fire|Silk|(?:Android|Linux).+KF[A-Z]{2,}/i],
  ['Amazon OS', /Kindle/i],
  ['Windows 3.11', /Win16/i],
  ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/i],
  ['Windows 98', /(Windows 98)|(Win98)/i],
  ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/i],
  ['Windows XP', /(Windows NT 5.1)|(Windows XP)/i],
  ['Windows Server 2003', /(Windows NT 5.2)/i],
  ['Windows Vista', /(Windows NT 6.0)/i],
  ['Windows 7', /(Windows NT 6.1)/i],
  ['Windows 8', /(Windows NT 6.2)/i],
  ['Windows 8.1', /(Windows NT 6.3)/i],
  ['Windows 10', /(Windows NT 10.0)/i],
  ['Windows ME', /Windows ME/i],
  ['Open BSD', /OpenBSD/i],
  ['Free BSD', /FreeBSD/i],
  ['Sun OS', /SunOS/i],
  ['Chrome OS', /CrOS/i],
  ['webOS', /webOS/i],
  ['Linux', /(Linux)|(X11)/i],
  ['Mac OS', /(Mac_PowerPC)|(Macintosh)/i],
];

const androidVersions = [
  ['Legacy', /android ([2,3])/i],
  ['Ice Cream Sandwich', /android (4.0)/i],
  ['Jellybean', /android (4.[1|2|3])/i],
  ['KitKat', /android (4.4)/i],
  ['Lollipop', /android (5)/i],
  ['Marshmallow', /android (6)/i],
  ['Nougat', /android (7.[0,1])/i],
  ['Oreo', /android (8.[0,1])/i],
  ['Pie', /android (9)/i],
  ['Q', /android (10)/i]
];

const operatingSystemVersions = {
  android: function(){
    let version = '';
    const {string:releaseName, match:releaseMatch} = testUserAgent(androidVersions);
    if(releaseName){
      version = releaseName;
      if(releaseMatch && releaseMatch.length === 2){
        version = `${releaseMatch[1]} (${releaseName})`;
      }
    }
    return version;
  },
  ios: function(){
    // iphone
    // Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1

    // ipad
    // Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1
    const regex = /CPU(?: iPhone)? OS (\d+(?:_\d+)*)/;
    const match = userAgent.match(regex);
    return match && match.length === 2 ? `${match[1].split('_').join('.')}` : '';
  },
  chrome_os: function(){
    // x86
    // Mozilla/5.0 (X11; CrOS x86_64 11895.95.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.125 Safari/537.36

    // arm
    // Mozilla/5.0 (X11; CrOS armv7l 10575.58.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36
    const regex = /\(X11; CrOS (?:x86_\d+|armv7l) ([0-9\.]*)\)/;
    const match = userAgent.match(regex);
    return match && match.length === 2 ? match[1] : '';
  },
  mac_os: function(){
    // chrome and safari
    //Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36
    //Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15

    // firefox
    // Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0

    const regex = /\(Macintosh(?:.)+Mac OS X (10(?:_\d+)+|10+\.\d+)/;
    const match = userAgent.match(regex);

    // chrome / safari have '_' we need to deal with. we can ignore the '.' in ff.
    return match && match.length === 2 ? `${match[1].split('_').join('.')}` : '';
  }
};


function slugify(string){
  return string.toLowerCase().replace(' ', '_');
}

/**
 * Given an array of useragent regexes and a useragent,
 * return the one that matches as both a string and regex match.
 *
 * return {Object/Boolean}
 * @param {Array} list  Array of UserAgent regexes
 * @param {String} ua   UserAgent string
 * @returns {Object} Matched string and regex match
 */
function testUserAgent(list, ua) {
  ua = ua || getUserAgent();
  for (let i = 0; i < list.length; i += 1) {
    const pattern = list[i][1];
    const match = ua.match(pattern);

    if (match !== null) {
      return {
        match,
        string: list[i][0]
      };
    }
  }

  return false;
}


/**
 * Get operating system and version
 *
 * return {Object}
 */
function getOperatingSystem() {
  if (!cache.getOperatingSystem) {
    let { string: name, match } = testUserAgent(commonOperatingSystems);
    name = name || 'unknown';

    // see if we have an os version test available
    const osSlug = slugify(name);
    const osVersionTest = operatingSystemVersions[osSlug];
    let version = osVersionTest ? osVersionTest() : '';

    cache.getOperatingSystem = {
      name,
      version
    };
  }

  return cache.getOperatingSystem;
}

/**
 * Is any major mobile browser
 *
 * return {Boolean}
 */
function isMobile() {
  if (!cache.isMobile) {
    cache.isMobile = isAndroid() || isIos() || isIpadOs() || isKindleFire () || isKindle() || isBlackberry() || isWindowsMobile () || isWebOS();
  }
  return cache.isMobile;
}

/**
 * Is a desktop browser
 * (or a non-detected mobile device)
 *
 * return {Boolean}
 */
function isDesktop() {
  if (!cache.isDesktop) {
    cache.isDesktop = !isMobile();
  }
  return cache.isDesktop;
}

/**
 * Is device running IpadOS? 
 * This is tricky because UA and navigator.platform 
 * report as a MacIntel desktop in iPadOS.
 * 
 * TODO: come up with a more reliable iPadOS detection, as this will 
 * likely fail when MacOS gets touch screens and other mobile-like 
 * capability.
 */
function isIpadOs() {
  if (!cache.isIpadOs) {
    cache.isIpadOs = isMacOs() && (!!navigator.maxTouchPoints && navigator.maxTouchPoints === 5);    
  }
  return cache.isIpadOs;
}

/**
 * Running iOS on iPhone,iPod and iPad
 *
 * return {Boolean}
 */
function isIos() {
  if (!cache.isIos) {
    cache.isIos = /iP(hone|od|ad)/.test(userAgent);
  }
  return cache.isIos;
}

/**
 * Is device an iPhone
 *
 * return {Boolean}
 */
function isIphone() {
  if (!cache.isIphone) {
    cache.isIphone = /iPhone/.test(userAgent);
  }
  return cache.isIphone;
}


/**
 * Does device run any version of Android
 *
 * return {Boolean}
 */
function isAndroid() {
  if (!cache.isAndroid) {
    cache.isAndroid = /Android/.test(userAgent);
  }
  return cache.isAndroid;
}

/**
 * Does device run any version of webOS
 *
 * return {Boolean}
 */
function isWebOS() {
  if (!cache.isWebOS) {
    cache.isWebOS = /webOS/.test(userAgent);
  }
  return cache.isWebOS;
}

/**
 * Is this a Blackberry
 *
 *  return {Boolean}
 */
function isBlackberry() {
  if (!cache.isBlackberry) {
    cache.isBlackberry = /Blackberry|BB10/.test(userAgent);
  }
  return cache.isBlackberry;
}

/**
 * Is an old-school kindle
 *
 * return {Boolean}
 */
function isKindle() {
  if (!cache.isKindle) {
    const {
      name: os
    } = getOperatingSystem();

    cache.isKindle = os.indexOf('Amazon OS') > -1;

  }
  return cache.isKindle;
}

/**
 * Is a Kindle Fire tablet.
 * This likely needs more work. The UA
 * is all over the place.
 *
 * return {Boolean}
 */
function isKindleFire() {
  if (!cache.isKindleFire) {
    const {
      name: os
    } = getOperatingSystem();
    cache.isKindleFire = os.indexOf('Fire OS') > -1;

  }
  return cache.isKindleFire;
}

/**
 * Does device run Windows Mobile
 *
 *  return {Boolean}
 */
function isWindowsMobile() {
  if (!cache.isWindowsMobile) {
    cache.isWindowsMobile = /IEMobile/.test(userAgent);
  }
  return cache.isWindowsMobile;
}

/**
 * Does device run any version of MacOS
 *
 * return {Boolean}
 */
function isMacOs() {
  if (!cache.isMacOs) {
    const {
      name: os
    } = getOperatingSystem();
    cache.isMacOs = os.indexOf('Mac') > -1;
  }
  return cache.isMacOs;
}

/**
 * Get userAgent string
 *
 * return {String}
 */
function getUserAgent() {
  return userAgent;
}

/**
 * Underscore's debounce:
 * http://underscorejs.org/#debounce
 */
const debounce = function(func, wait, immediate) {
  var result;
  var timeout = null;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
    }
    return result;
  };
};

const classNamePrefixes = {
  env: 'g-page',
  breakpoint: 'g-viewport'
};

const breakpoints = {
  xxsmall: 320,
  xsmall: 480,
  small: 600,
  medium: 740,
  large: 1024,
  xlarge: 1150,
  xxlarge: 1440
};

// const ratioLimits = {
// 	landscape: 1.26,
// 	portrait: 1.15
// };

const userAgent$1 = getUserAgent();

let debug = false;

const html = document.documentElement;

// Environment
// -----------------------
const isApp = () => !!(
  window.location.href.indexOf('app.html') > 0 ||
  window.location.search.indexOf('nytapp') > -1 || // sometimes this query param is present
  userAgent$1.match(/nyt[-_]?(?:ios|android)/i) || // usually the user agent is set
  (userAgent$1.match(/android/i) && window.__HYBRID__) // on hybrid articles in android, the user agent and qs is missing
);

const getEnvironment = () => {
  if (location.hostname.indexOf('localhost') > -1) {
    return 'development';
  }

  if (location.hostname === 'preview.nyt.net') {
    return 'preview';
  }

  return 'production';
};

const getState = () => ({
  isApp: isApp(),
  isIos: isIos(),
  isAndroid: isAndroid(),
  isIphone: isIphone(),
  isMobile: isMobile(),
  isDesktop: isDesktop(),
  isLandscape: isLandscape(),
  isPortrait: isPortrait(),
  isWideScreen: isWideScreen(),
  isSmallScreen: isSmallScreen(),
  isLargeScreen: isLargeScreen(),
  isHighDensity: isHighDensity(),
  isRetina: isRetina()
});

/**
 * Return an array of breakpoint names, width and active status
 *
 * [{name: 'xxsmall', width: '320', active: true}, {}]
 */
const getBreakpoints = () => {
  const vw = getViewport().width;

  return Object.keys(breakpoints).map(name => {
    const width = breakpoints[name];

    return {
      width,
      name,
      active: vw >= width
    };
  });
};

/**
 * Maintain classes on the html element that reflect the
 * current state of all the isSomething functions
 *
 * For example: isMobile() -> html.g-env-ismobile
 * @param {*} debug
 */
const prepEnvironment = (_debug) => {
  _debug = _debug || debug;

  // update cached viewport values
  setViewport();

  getBreakpoints().forEach((breakpoint) => {
    // g-viewport-xxsmall, etc
    const className = `${classNamePrefixes.breakpoint}-${breakpoint.name}`;

    if (breakpoint.active) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
    }

    if (_debug) {
      console.log(breakpoint.name, breakpoint.active);
    }
  });

  // run all test and record their true/false state.
  // ex: isMobile() -> g-env-ismobile
  const testResults = getState();
  Object.keys(testResults).forEach((fnName) => {
    // isMobile to g-env-ismobile
    const className = `${classNamePrefixes.env}-${fnName.toLowerCase()}`;
    const result = testResults[fnName];

    // add or remove html class based on result of test
    if (result) {
      html.classList.add(className);
    } else {
      html.classList.remove(className);
    }

    if (_debug) {
      console.log(fnName, result);
    }
  });
};

// Resolution
// -----------------------

const pixelRatio = () => window.devicePixelRatio || 1.0;

const isHighDensity = () => (
  (window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) ||
  (pixelRatio() > 1.3)
);

// http://stackoverflow.com/questions/19689715/what-is-the-best-way-to-detect-retina-support-on-a-device-using-javascript
const isRetina = () => ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches ||
window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) ||
(pixelRatio() >= 2)) && /(iPad|iPhone|iPod)/g.test(userAgent$1);


// Viewport, Aspect & Orientation
// -----------------------

let cachedViewport;

const setViewport = () => {
  const width = Math.max(html.clientWidth, window.innerWidth);
  const height = Math.max(html.clientHeight, window.innerHeight);
  const aspectRatio = width / height;
  cachedViewport = { width, height, aspectRatio };
};

const getViewport = () => {
  if (!cachedViewport) {
    setViewport();
  }

  return cachedViewport;
};

const getAspectRatio = () => getViewport().aspectRatio;
const isLandscape = () => getAspectRatio() > 1;
const isPortrait = () => !isLandscape();
const isWideScreen = () => getAspectRatio() > (breakpoints.xxlarge / 1029);


// Size
// -----------------------

const isSmallScreen = () => getViewport().width <= breakpoints.medium;
const isLargeScreen = () => getViewport().width >= breakpoints.xlarge;



// START APP
// ---------------------


html.classList.add(`${classNamePrefixes.env}-${getEnvironment()}`);


const debouncedPrepEnvironment = debounce(prepEnvironment, 250);
window.addEventListener('resize', () => { debouncedPrepEnvironment(); });
prepEnvironment();

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var scrollmagic = createCommonjsModule(function (module, exports) {
/*! ScrollMagic v2.0.7 | (c) 2019 Jan Paepke (@janpaepke) | license & info: http://scrollmagic.io */
!function(e,t){module.exports=t();}(commonjsGlobal,function(){var _=function(){};_.version="2.0.7",window.addEventListener("mousewheel",function(){});var P="data-scrollmagic-pin-spacer";_.Controller=function(e){var n,r,i="REVERSE",t="PAUSED",o=z.defaults,s=this,a=R.extend({},o,e),l=[],c=!1,f=0,u=t,d=!0,h=0,p=!0,g=function(){0<a.refreshInterval&&(r=window.setTimeout(E,a.refreshInterval));},v=function(){return a.vertical?R.get.scrollTop(a.container):R.get.scrollLeft(a.container)},m=function(){return a.vertical?R.get.height(a.container):R.get.width(a.container)},w=this._setScrollPos=function(e){a.vertical?d?window.scrollTo(R.get.scrollLeft(),e):a.container.scrollTop=e:d?window.scrollTo(e,R.get.scrollTop()):a.container.scrollLeft=e;},y=function(){if(p&&c){var e=R.type.Array(c)?c:l.slice(0);c=!1;var t=f,n=(f=s.scrollPos())-t;0!==n&&(u=0<n?"FORWARD":i),u===i&&e.reverse(),e.forEach(function(e,t){e.update(!0);});}},S=function(){n=R.rAF(y);},b=function(e){"resize"==e.type&&(h=m(),u=t),!0!==c&&(c=!0,S());},E=function(){if(!d&&h!=m()){var t;try{t=new Event("resize",{bubbles:!1,cancelable:!1});}catch(e){(t=document.createEvent("Event")).initEvent("resize",!1,!1);}a.container.dispatchEvent(t);}l.forEach(function(e,t){e.refresh();}),g();};this._options=a;var x=function(e){if(e.length<=1)return e;var t=e.slice(0);return t.sort(function(e,t){return e.scrollOffset()>t.scrollOffset()?1:-1}),t};return this.addScene=function(e){if(R.type.Array(e))e.forEach(function(e,t){s.addScene(e);});else if(e instanceof _.Scene)if(e.controller()!==s)e.addTo(s);else if(l.indexOf(e)<0)for(var t in l.push(e),l=x(l),e.on("shift.controller_sort",function(){l=x(l);}),a.globalSceneOptions)e[t]&&e[t].call(e,a.globalSceneOptions[t]);return s},this.removeScene=function(e){if(R.type.Array(e))e.forEach(function(e,t){s.removeScene(e);});else {var t=l.indexOf(e);-1<t&&(e.off("shift.controller_sort"),l.splice(t,1),e.remove());}return s},this.updateScene=function(e,n){return R.type.Array(e)?e.forEach(function(e,t){s.updateScene(e,n);}):n?e.update(!0):!0!==c&&e instanceof _.Scene&&(-1==(c=c||[]).indexOf(e)&&c.push(e),c=x(c),S()),s},this.update=function(e){return b({type:"resize"}),e&&y(),s},this.scrollTo=function(e,t){if(R.type.Number(e))w.call(a.container,e,t);else if(e instanceof _.Scene)e.controller()===s&&s.scrollTo(e.scrollOffset(),t);else if(R.type.Function(e))w=e;else {var n=R.get.elements(e)[0];if(n){for(;n.parentNode.hasAttribute(P);)n=n.parentNode;var r=a.vertical?"top":"left",i=R.get.offset(a.container),o=R.get.offset(n);d||(i[r]-=s.scrollPos()),s.scrollTo(o[r]-i[r],t);}}return s},this.scrollPos=function(e){return arguments.length?(R.type.Function(e)&&(v=e),s):v.call(s)},this.info=function(e){var t={size:h,vertical:a.vertical,scrollPos:f,scrollDirection:u,container:a.container,isDocument:d};return arguments.length?void 0!==t[e]?t[e]:void 0:t},this.loglevel=function(e){return s},this.enabled=function(e){return arguments.length?(p!=e&&(p=!!e,s.updateScene(l,!0)),s):p},this.destroy=function(e){window.clearTimeout(r);for(var t=l.length;t--;)l[t].destroy(e);return a.container.removeEventListener("resize",b),a.container.removeEventListener("scroll",b),R.cAF(n),null},function(){for(var e in a)o.hasOwnProperty(e)||delete a[e];if(a.container=R.get.elements(a.container)[0],!a.container)throw "ScrollMagic.Controller init failed.";(d=a.container===window||a.container===document.body||!document.body.contains(a.container))&&(a.container=window),h=m(),a.container.addEventListener("resize",b),a.container.addEventListener("scroll",b);var t=parseInt(a.refreshInterval,10);a.refreshInterval=R.type.Number(t)?t:o.refreshInterval,g();}(),s};var z={defaults:{container:window,vertical:!0,globalSceneOptions:{},loglevel:2,refreshInterval:100}};_.Controller.addOption=function(e,t){z.defaults[e]=t;},_.Controller.extend=function(e){var t=this;_.Controller=function(){return t.apply(this,arguments),this.$super=R.extend({},this),e.apply(this,arguments)||this},R.extend(_.Controller,t),_.Controller.prototype=t.prototype,_.Controller.prototype.constructor=_.Controller;},_.Scene=function(e){var n,l,c="BEFORE",f="DURING",u="AFTER",r=D.defaults,d=this,h=R.extend({},r,e),p=c,g=0,a={start:0,end:0},v=0,i=!0,s={};this.on=function(e,i){return R.type.Function(i)&&(e=e.trim().split(" ")).forEach(function(e){var t=e.split("."),n=t[0],r=t[1];"*"!=n&&(s[n]||(s[n]=[]),s[n].push({namespace:r||"",callback:i}));}),d},this.off=function(e,o){return e&&(e=e.trim().split(" ")).forEach(function(e,t){var n=e.split("."),r=n[0],i=n[1]||"";("*"===r?Object.keys(s):[r]).forEach(function(e){for(var t=s[e]||[],n=t.length;n--;){var r=t[n];!r||i!==r.namespace&&"*"!==i||o&&o!=r.callback||t.splice(n,1);}t.length||delete s[e];});}),d},this.trigger=function(e,n){if(e){var t=e.trim().split("."),r=t[0],i=t[1],o=s[r];o&&o.forEach(function(e,t){i&&i!==e.namespace||e.callback.call(d,new _.Event(r,e.namespace,d,n));});}return d},d.on("change.internal",function(e){"loglevel"!==e.what&&"tweenChanges"!==e.what&&("triggerElement"===e.what?y():"reverse"===e.what&&d.update());}).on("shift.internal",function(e){t(),d.update();}),this.addTo=function(e){return e instanceof _.Controller&&l!=e&&(l&&l.removeScene(d),l=e,E(),o(!0),y(!0),t(),l.info("container").addEventListener("resize",S),e.addScene(d),d.trigger("add",{controller:l}),d.update()),d},this.enabled=function(e){return arguments.length?(i!=e&&(i=!!e,d.update(!0)),d):i},this.remove=function(){if(l){l.info("container").removeEventListener("resize",S);var e=l;l=void 0,e.removeScene(d),d.trigger("remove");}return d},this.destroy=function(e){return d.trigger("destroy",{reset:e}),d.remove(),d.off("*.*"),null},this.update=function(e){if(l)if(e)if(l.enabled()&&i){var t,n=l.info("scrollPos");t=0<h.duration?(n-a.start)/(a.end-a.start):n>=a.start?1:0,d.trigger("update",{startPos:a.start,endPos:a.end,scrollPos:n}),d.progress(t);}else m&&p===f&&C(!0);else l.updateScene(d,!1);return d},this.refresh=function(){return o(),y(),d},this.progress=function(e){if(arguments.length){var t=!1,n=p,r=l?l.info("scrollDirection"):"PAUSED",i=h.reverse||g<=e;if(0===h.duration?(t=g!=e,p=0===(g=e<1&&i?0:1)?c:f):e<0&&p!==c&&i?(p=c,t=!(g=0)):0<=e&&e<1&&i?(g=e,p=f,t=!0):1<=e&&p!==u?(g=1,p=u,t=!0):p!==f||i||C(),t){var o={progress:g,state:p,scrollDirection:r},s=p!=n,a=function(e){d.trigger(e,o);};s&&n!==f&&(a("enter"),a(n===c?"start":"end")),a("progress"),s&&p!==f&&(a(p===c?"start":"end"),a("leave"));}return d}return g};var m,w,t=function(){a={start:v+h.offset},l&&h.triggerElement&&(a.start-=l.info("size")*h.triggerHook),a.end=a.start+h.duration;},o=function(e){if(n){var t="duration";x(t,n.call(d))&&!e&&(d.trigger("change",{what:t,newval:h[t]}),d.trigger("shift",{reason:t}));}},y=function(e){var t=0,n=h.triggerElement;if(l&&(n||0<v)){if(n)if(n.parentNode){for(var r=l.info(),i=R.get.offset(r.container),o=r.vertical?"top":"left";n.parentNode.hasAttribute(P);)n=n.parentNode;var s=R.get.offset(n);r.isDocument||(i[o]-=l.scrollPos()),t=s[o]-i[o];}else d.triggerElement(void 0);var a=t!=v;v=t,a&&!e&&d.trigger("shift",{reason:"triggerElementPosition"});}},S=function(e){0<h.triggerHook&&d.trigger("shift",{reason:"containerResize"});},b=R.extend(D.validate,{duration:function(t){if(R.type.String(t)&&t.match(/^(\.|\d)*\d+%$/)){var e=parseFloat(t)/100;t=function(){return l?l.info("size")*e:0};}if(R.type.Function(t)){n=t;try{t=parseFloat(n.call(d));}catch(e){t=-1;}}if(t=parseFloat(t),!R.type.Number(t)||t<0)throw n&&(n=void 0),0;return t}}),E=function(e){(e=arguments.length?[e]:Object.keys(b)).forEach(function(t,e){var n;if(b[t])try{n=b[t](h[t]);}catch(e){n=r[t];}finally{h[t]=n;}});},x=function(e,t){var n=!1,r=h[e];return h[e]!=t&&(h[e]=t,E(e),n=r!=h[e]),n},z=function(t){d[t]||(d[t]=function(e){return arguments.length?("duration"===t&&(n=void 0),x(t,e)&&(d.trigger("change",{what:t,newval:h[t]}),-1<D.shifts.indexOf(t)&&d.trigger("shift",{reason:t})),d):h[t]});};this.controller=function(){return l},this.state=function(){return p},this.scrollOffset=function(){return a.start},this.triggerPosition=function(){var e=h.offset;return l&&(h.triggerElement?e+=v:e+=l.info("size")*d.triggerHook()),e},d.on("shift.internal",function(e){var t="duration"===e.reason;(p===u&&t||p===f&&0===h.duration)&&C(),t&&F();}).on("progress.internal",function(e){C();}).on("add.internal",function(e){F();}).on("destroy.internal",function(e){d.removePin(e.reset);});var C=function(e){if(m&&l){var t=l.info(),n=w.spacer.firstChild;if(e||p!==f){var r={position:w.inFlow?"relative":"absolute",top:0,left:0},i=R.css(n,"position")!=r.position;w.pushFollowers?0<h.duration&&(p===u&&0===parseFloat(R.css(w.spacer,"padding-top"))?i=!0:p===c&&0===parseFloat(R.css(w.spacer,"padding-bottom"))&&(i=!0)):r[t.vertical?"top":"left"]=h.duration*g,R.css(n,r),i&&F();}else {"fixed"!=R.css(n,"position")&&(R.css(n,{position:"fixed"}),F());var o=R.get.offset(w.spacer,!0),s=h.reverse||0===h.duration?t.scrollPos-a.start:Math.round(g*h.duration*10)/10;o[t.vertical?"top":"left"]+=s,R.css(w.spacer.firstChild,{top:o.top,left:o.left});}}},F=function(){if(m&&l&&w.inFlow){var e=p===f,t=l.info("vertical"),n=w.spacer.firstChild,r=R.isMarginCollapseType(R.css(w.spacer,"display")),i={};w.relSize.width||w.relSize.autoFullWidth?e?R.css(m,{width:R.get.width(w.spacer)}):R.css(m,{width:"100%"}):(i["min-width"]=R.get.width(t?m:n,!0,!0),i.width=e?i["min-width"]:"auto"),w.relSize.height?e?R.css(m,{height:R.get.height(w.spacer)-(w.pushFollowers?h.duration:0)}):R.css(m,{height:"100%"}):(i["min-height"]=R.get.height(t?n:m,!0,!r),i.height=e?i["min-height"]:"auto"),w.pushFollowers&&(i["padding"+(t?"Top":"Left")]=h.duration*g,i["padding"+(t?"Bottom":"Right")]=h.duration*(1-g)),R.css(w.spacer,i);}},L=function(){l&&m&&p===f&&!l.info("isDocument")&&C();},T=function(){l&&m&&p===f&&((w.relSize.width||w.relSize.autoFullWidth)&&R.get.width(window)!=R.get.width(w.spacer.parentNode)||w.relSize.height&&R.get.height(window)!=R.get.height(w.spacer.parentNode))&&F();},A=function(e){l&&m&&p===f&&!l.info("isDocument")&&(e.preventDefault(),l._setScrollPos(l.info("scrollPos")-((e.wheelDelta||e[l.info("vertical")?"wheelDeltaY":"wheelDeltaX"])/3||30*-e.detail)));};this.setPin=function(e,t){if(t=R.extend({},{pushFollowers:!0,spacerClass:"scrollmagic-pin-spacer"},t),!(e=R.get.elements(e)[0]))return d;if("fixed"===R.css(e,"position"))return d;if(m){if(m===e)return d;d.removePin();}var n=(m=e).parentNode.style.display,r=["top","left","bottom","right","margin","marginLeft","marginRight","marginTop","marginBottom"];m.parentNode.style.display="none";var i="absolute"!=R.css(m,"position"),o=R.css(m,r.concat(["display"])),s=R.css(m,["width","height"]);m.parentNode.style.display=n,!i&&t.pushFollowers&&(t.pushFollowers=!1);var a=m.parentNode.insertBefore(document.createElement("div"),m),l=R.extend(o,{position:i?"relative":"absolute",boxSizing:"content-box",mozBoxSizing:"content-box",webkitBoxSizing:"content-box"});if(i||R.extend(l,R.css(m,["width","height"])),R.css(a,l),a.setAttribute(P,""),R.addClass(a,t.spacerClass),w={spacer:a,relSize:{width:"%"===s.width.slice(-1),height:"%"===s.height.slice(-1),autoFullWidth:"auto"===s.width&&i&&R.isMarginCollapseType(o.display)},pushFollowers:t.pushFollowers,inFlow:i},!m.___origStyle){m.___origStyle={};var c=m.style;r.concat(["width","height","position","boxSizing","mozBoxSizing","webkitBoxSizing"]).forEach(function(e){m.___origStyle[e]=c[e]||"";});}return w.relSize.width&&R.css(a,{width:s.width}),w.relSize.height&&R.css(a,{height:s.height}),a.appendChild(m),R.css(m,{position:i?"relative":"absolute",margin:"auto",top:"auto",left:"auto",bottom:"auto",right:"auto"}),(w.relSize.width||w.relSize.autoFullWidth)&&R.css(m,{boxSizing:"border-box",mozBoxSizing:"border-box",webkitBoxSizing:"border-box"}),window.addEventListener("scroll",L),window.addEventListener("resize",L),window.addEventListener("resize",T),m.addEventListener("mousewheel",A),m.addEventListener("DOMMouseScroll",A),C(),d},this.removePin=function(e){if(m){if(p===f&&C(!0),e||!l){var t=w.spacer.firstChild;if(t.hasAttribute(P)){var n=w.spacer.style,r={};["margin","marginLeft","marginRight","marginTop","marginBottom"].forEach(function(e){r[e]=n[e]||"";}),R.css(t,r);}w.spacer.parentNode.insertBefore(t,w.spacer),w.spacer.parentNode.removeChild(w.spacer),m.parentNode.hasAttribute(P)||(R.css(m,m.___origStyle),delete m.___origStyle);}window.removeEventListener("scroll",L),window.removeEventListener("resize",L),window.removeEventListener("resize",T),m.removeEventListener("mousewheel",A),m.removeEventListener("DOMMouseScroll",A),m=void 0;}return d};var N,O=[];return d.on("destroy.internal",function(e){d.removeClassToggle(e.reset);}),this.setClassToggle=function(e,t){var n=R.get.elements(e);return 0!==n.length&&R.type.String(t)&&(0<O.length&&d.removeClassToggle(),N=t,O=n,d.on("enter.internal_class leave.internal_class",function(e){var n="enter"===e.type?R.addClass:R.removeClass;O.forEach(function(e,t){n(e,N);});})),d},this.removeClassToggle=function(e){return e&&O.forEach(function(e,t){R.removeClass(e,N);}),d.off("start.internal_class end.internal_class"),N=void 0,O=[],d},function(){for(var e in h)r.hasOwnProperty(e)||delete h[e];for(var t in r)z(t);E();}(),d};var D={defaults:{duration:0,offset:0,triggerElement:void 0,triggerHook:.5,reverse:!0,loglevel:2},validate:{offset:function(e){if(e=parseFloat(e),!R.type.Number(e))throw 0;return e},triggerElement:function(e){if(e=e||void 0){var t=R.get.elements(e)[0];if(!t||!t.parentNode)throw 0;e=t;}return e},triggerHook:function(e){var t={onCenter:.5,onEnter:1,onLeave:0};if(R.type.Number(e))e=Math.max(0,Math.min(parseFloat(e),1));else {if(!(e in t))throw 0;e=t[e];}return e},reverse:function(e){return !!e}},shifts:["duration","offset","triggerHook"]};_.Scene.addOption=function(e,t,n,r){e in D.defaults||(D.defaults[e]=t,D.validate[e]=n,r&&D.shifts.push(e));},_.Scene.extend=function(e){var t=this;_.Scene=function(){return t.apply(this,arguments),this.$super=R.extend({},this),e.apply(this,arguments)||this},R.extend(_.Scene,t),_.Scene.prototype=t.prototype,_.Scene.prototype.constructor=_.Scene;},_.Event=function(e,t,n,r){for(var i in r=r||{})this[i]=r[i];return this.type=e,this.target=this.currentTarget=n,this.namespace=t||"",this.timeStamp=this.timestamp=Date.now(),this};var R=_._util=function(s){var n,e={},a=function(e){return parseFloat(e)||0},l=function(e){return e.currentStyle?e.currentStyle:s.getComputedStyle(e)},r=function(e,t,n,r){if((t=t===document?s:t)===s)r=!1;else if(!u.DomElement(t))return 0;e=e.charAt(0).toUpperCase()+e.substr(1).toLowerCase();var i=(n?t["offset"+e]||t["outer"+e]:t["client"+e]||t["inner"+e])||0;if(n&&r){var o=l(t);i+="Height"===e?a(o.marginTop)+a(o.marginBottom):a(o.marginLeft)+a(o.marginRight);}return i},c=function(e){return e.replace(/^[^a-z]+([a-z])/g,"$1").replace(/-([a-z])/g,function(e){return e[1].toUpperCase()})};e.extend=function(e){for(e=e||{},n=1;n<arguments.length;n++)if(arguments[n])for(var t in arguments[n])arguments[n].hasOwnProperty(t)&&(e[t]=arguments[n][t]);return e},e.isMarginCollapseType=function(e){return -1<["block","flex","list-item","table","-webkit-box"].indexOf(e)};var i=0,t=["ms","moz","webkit","o"],o=s.requestAnimationFrame,f=s.cancelAnimationFrame;for(n=0;!o&&n<4;++n)o=s[t[n]+"RequestAnimationFrame"],f=s[t[n]+"CancelAnimationFrame"]||s[t[n]+"CancelRequestAnimationFrame"];o||(o=function(e){var t=(new Date).getTime(),n=Math.max(0,16-(t-i)),r=s.setTimeout(function(){e(t+n);},n);return i=t+n,r}),f||(f=function(e){s.clearTimeout(e);}),e.rAF=o.bind(s),e.cAF=f.bind(s);var u=e.type=function(e){return Object.prototype.toString.call(e).replace(/^\[object (.+)\]$/,"$1").toLowerCase()};u.String=function(e){return "string"===u(e)},u.Function=function(e){return "function"===u(e)},u.Array=function(e){return Array.isArray(e)},u.Number=function(e){return !u.Array(e)&&0<=e-parseFloat(e)+1},u.DomElement=function(e){return "object"==typeof HTMLElement||"function"==typeof HTMLElement?e instanceof HTMLElement||e instanceof SVGElement:e&&"object"==typeof e&&null!==e&&1===e.nodeType&&"string"==typeof e.nodeName};var d=e.get={};return d.elements=function(e){var t=[];if(u.String(e))try{e=document.querySelectorAll(e);}catch(e){return t}if("nodelist"===u(e)||u.Array(e)||e instanceof NodeList)for(var n=0,r=t.length=e.length;n<r;n++){var i=e[n];t[n]=u.DomElement(i)?i:d.elements(i);}else (u.DomElement(e)||e===document||e===s)&&(t=[e]);return t},d.scrollTop=function(e){return e&&"number"==typeof e.scrollTop?e.scrollTop:s.pageYOffset||0},d.scrollLeft=function(e){return e&&"number"==typeof e.scrollLeft?e.scrollLeft:s.pageXOffset||0},d.width=function(e,t,n){return r("width",e,t,n)},d.height=function(e,t,n){return r("height",e,t,n)},d.offset=function(e,t){var n={top:0,left:0};if(e&&e.getBoundingClientRect){var r=e.getBoundingClientRect();n.top=r.top,n.left=r.left,t||(n.top+=d.scrollTop(),n.left+=d.scrollLeft());}return n},e.addClass=function(e,t){t&&(e.classList?e.classList.add(t):e.className+=" "+t);},e.removeClass=function(e,t){t&&(e.classList?e.classList.remove(t):e.className=e.className.replace(RegExp("(^|\\b)"+t.split(" ").join("|")+"(\\b|$)","gi")," "));},e.css=function(e,t){if(u.String(t))return l(e)[c(t)];if(u.Array(t)){var n={},r=l(e);return t.forEach(function(e,t){n[e]=r[c(e)];}),n}for(var i in t){var o=t[i];o==parseFloat(o)&&(o+="px"),e.style[c(i)]=o;}},e}(window||{});return _});
});

var yml = {
	pages: {
		index: {
			headline: "Designed to Deceive: Do These People Look Real to You?",
			Alt: "",
			byline: "By <a href=\"https://www.nytimes.com/by/kashmir-hill\">Kashmir Hill</a> and <a href=\"https://www.nytimes.com/by/jeremy-white\">Jeremy White</a>",
			leadin: "",
			summary: "The people in this story may look familiar, like ones youâ€™ve seen on Facebook or Twitter or Tinder. But they donâ€™t exist. They were born from the mind of a computer, and the technology behind them is improving at a startling pace.",
			pubdate: "Nov. 21, 2020",
			tweet: "",
			sources: "",
			credit: "Note: A pre-trained version of Nvidia's StyleGAN2 package, implemented in TensorFlow, was used to generate the images for this story. The networks trained on the Flickr-Faces-HQ dataset, which included over 70,000 photographs of people. Improvements to the original StyleGAN architecture by <a href=\"https://arxiv.org/abs/1912.04958\">Karras et. al</a>.",
			last_updated_text: "",
			scoop_username: "jeremy.white",
			scoop_slug: "artificial-intelligence-fake-people-faces",
			scoop_asset_id: "100000007463709",
			scoop_external_edit_key: "STYBIGAS3VQiJ5rGqfA0ID1jA6WeVIhiASaGOEoknb9trufl2qaIHlH+sa0LY7Hj"
		}
	}
};
var body = [
	{
		type: "scrollingvideo",
		value: {
			id: "scrolling_video_top",
			framerate: "30",
			framelength: "600",
			startscroll: "0.1",
			endscroll: "0.9",
			heightdesktop: "0.5",
			heightmobile: "0.4",
			desktop: "1024,1024",
			mobile: "800,800",
			"asset-max-width": "fullbleed",
			hed: "",
			sources: "",
			credit: "",
			asset: "",
			https: "//int.nyt.com/newsgraphics/2020/these-people-are-not-real/top/top-v4-1024.mp4",
			rendition_asset: "https://int.nyt.com/newsgraphics/2020/these-people-are-not-real/top/top-v4",
			single_frames: "https://int.nyt.com/newsgraphics/2020/these-people-are-not-real/top/stills/top-v4",
			slides: [
				{
					text: "These people may look familiar, like ones youâ€™ve seen on Facebook or Twitter.",
					percent: "0.065",
					fallbackdesktop: "fallbacks/desktop-01.jpg",
					fallbackmobile: "fallbacks/mobile-01.jpg"
				},
				{
					text: "Or people whose product reviews youâ€™ve read on Amazon, or dating profiles youâ€™ve seen on Tinder.",
					percent: "0.21",
					fallbackdesktop: "fallbacks/desktop-02.jpg",
					fallbackmobile: "fallbacks/mobile-02.jpg"
				},
				{
					text: "They look stunningly real at first glance.",
					percent: "0.40",
					fallbackdesktop: "fallbacks/desktop-03.jpg",
					fallbackmobile: "fallbacks/mobile-03.jpg"
				},
				{
					text: "But they do not exist.",
					percent: "0.50",
					fallbackdesktop: "fallbacks/desktop-04.jpg",
					fallbackmobile: "fallbacks/mobile-04.jpg"
				},
				{
					text: "They were born from the mind of a computer.",
					percent: "0.62",
					fallbackdesktop: "fallbacks/desktop-05.jpg",
					fallbackmobile: "fallbacks/mobile-05.jpg"
				},
				{
					text: "And the technology that makes them is improving at a startling pace.",
					percent: "0.72",
					fallbackdesktop: "fallbacks/desktop-06.jpg",
					fallbackmobile: "fallbacks/mobile-06.jpg"
				},
				{
					text: "",
					template: "custom/header",
					percent: "0.95",
					fallbackdesktop: "fallbacksdesktop-07.jpg",
					fallbackmobile: "fallbacks/mobile-07.jpg"
				}
			]
		},
		css: ""
	},
	{
		type: "start",
		value: "g-background-to-white",
		css: ""
	},
	{
		type: "end",
		value: "g-background-to-white",
		css: ""
	},
	{
		type: "text",
		value: "There are now businesses that sell fake people. On the website Generated.Photos, you can buy a â€œunique, worry-freeâ€ fake person for $2.99, or 1,000 people for $1,000. If you just need a couple of fake people â€” for characters in a video game, or to make your company website <a href=\"https://twitter.com/chanceinh3ll/status/1271816775466795010\">appear more diverse</a> â€” you can get their photos for free on ThisPersonDoesNotExist.com. Adjust their likeness as needed; make them old or young or the ethnicity of your choosing. If you want your fake person animated, a company called Rosebud.AI can do that and can even make them talk.",
		css: ""
	},
	{
		type: "text",
		value: "These simulated people are starting to show up around the internet, used as masks by real people with nefarious intent: spies who don <a href=\"https://apnews.com/article/bc2f19097a4c4fffaa00de6770b8a60d\">an attractive face</a> in an effort to infiltrate the intelligence community; <a href=\"https://www.thedailybeast.com/right-wing-media-outlets-duped-by-a-middle-east-propaganda-campaign\">right-wing propagandists</a> who hide behind fake profiles, photo and all; online <a href=\"https://kslnewsradio.com/1919785/how-ai-faces-are-being-weaponized-online/\">harassers</a> who troll their targets with a friendly visage.",
		css: ""
	},
	{
		type: "subhed",
		value: "We created our own A.I. system to understand how easy it is to generate different fake faces.",
		css: ""
	},
	{
		type: "text",
		value: "The A.I. system sees each face as a complex mathematical figure, a range of values that can be shifted. Choosing different values â€” like those that determine the size and shape of eyes â€” can alter the whole image.",
		css: ""
	},
	{
		type: "start",
		value: "g-sliders-container",
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "tom_age",
			title: "Age",
			low: "",
			high: "",
			background: "sprites/tom-age.jpg",
			depth: "49",
			index: "17"
		},
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "alice_eyes",
			title: "Eyes",
			low: "",
			high: "",
			background: "sprites/alice-eyes-v2.jpg",
			depth: "49",
			index: "30"
		},
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "shawn_yaw",
			title: "Perspective",
			low: "",
			high: "",
			background: "sprites/shawn-yaw-v2.jpg",
			depth: "49",
			index: "39"
		},
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "maggie_smile",
			title: "Mood",
			low: "",
			high: "",
			background: "sprites/maggie-smile.jpg",
			depth: "49",
			index: "16"
		},
		css: ""
	},
	{
		type: "end",
		value: "g-sliders-container",
		css: ""
	},
	{
		type: "text",
		value: "For other qualities, our system used a different approach. Instead of shifting values that determine specific parts of the image, the system first generated two images to establish starting and end points for all of the values, and then created images in between.",
		css: ""
	},
	{
		type: "start",
		value: "g-sliders-container",
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "drew_gender",
			title: "Gender",
			low: "",
			high: "",
			background: "sprites/drew-gender.jpg",
			depth: "49",
			index: "14"
		},
		css: ""
	},
	{
		type: "slider",
		value: {
			id: "ed_race",
			title: "Race&nbsp;and&nbsp;Ethnicity",
			low: "",
			high: "",
			background: "sprites/ed-race-2.jpg",
			depth: "49",
			index: "44"
		},
		css: ""
	},
	{
		type: "end",
		value: "g-sliders-container",
		css: ""
	},
	{
		type: "text",
		value: "The creation of these types of fake images only became possible in recent years thanks to a new type of artificial intelligence called a generative adversarial network. In essence, you feed a computer program a bunch of photos of real people. It studies them and tries to come up with its own photos of people, while another part of the system tries to detect which of those photos are fake.",
		css: ""
	},
	{
		type: "text",
		value: "The back-and-forth makes the end product ever more indistinguishable from the real thing. The portraits in this story were created by The Times using GAN software that was made publicly available by the computer graphics company Nvidia.",
		css: ""
	},
	{
		type: "text",
		value: "Given the pace of improvement, itâ€™s easy to imagine a not-so-distant future in which we are confronted with not just single portraits of fake people but whole collections of them â€” at a party with fake friends, hanging out with their fake dogs, holding their fake babies. It will become increasingly difficult to tell who is real online and who is a figment of a computerâ€™s imagination.",
		css: ""
	},
	{
		type: "text",
		value: "â€œWhen the tech first appeared in 2014, it was bad â€” it looked like <a href=\"https://www.nytimes.com/2009/05/14/business/media/14adco.html\">the Sims</a>,â€ said Camille FranÃ§ois, a disinformation researcher whose job is to analyze manipulation of social networks. â€œItâ€™s a reminder of how quickly the technology can evolve. Detection will only get harder over time.â€",
		css: ""
	},
	{
		type: "text",
		value: "Advances in facial fakery have been made possible in part because technology has become so much better at identifying key facial features. You can use your face to unlock your smartphone, or tell your photo software to sort through your thousands of pictures and show you only those of your child. Facial recognition programs are used by law enforcement to identify and arrest criminal suspects (and also by <a href=\"https://www.nytimes.com/2020/10/21/technology/facial-recognition-police.html\">some activists</a> to reveal the identities of police officers who cover their name tags in an attempt to remain anonymous). A company called <a href=\"https://www.nytimes.com/2020/01/18/technology/clearview-privacy-facial-recognition.html\">Clearview AI</a> scraped the web of billions of public photos â€” casually shared online by everyday users â€” to create an app capable of recognizing a stranger from just one photo. The technology promises superpowers: the ability to organize and process the world in a way that wasnâ€™t possible before.",
		css: ""
	},
	{
		type: "ad",
		value: "",
		css: ""
	},
	{
		type: "text",
		value: "But facial-recognition algorithms, like other A.I. systems, are not perfect. Thanks to underlying bias in the data used to train them, some of these systems are not as good, for instance, at recognizing people of color. In 2015, an early image-detection system developed by Google <a href=\"https://bits.blogs.nytimes.com/2015/07/01/google-photos-mistakenly-labels-black-people-gorillas/\">labeled</a> two Black people as â€œgorillas,â€ most likely because the system had been fed many more photos of gorillas than of people with dark skin.",
		css: ""
	},
	{
		type: "text",
		value: "Moreover, cameras â€” the eyes of facial-recognition systems â€” are <a href=\"https://www.mic.com/articles/184244/keeping-insecure-lit-hbo-cinematographer-ava-berkofsky-on-properly-lighting-black-faces\">not as good</a> at capturing people with dark skin; that unfortunate standard dates to the early days of film development, when photos <a href=\"https://www.npr.org/2014/11/13/363517842/for-decades-kodak-s-shirley-cards-set-photography-s-skin-tone-standard\">were calibrated</a> to best show the <a href=\"https://www.nytimes.com/2019/04/25/lens/sarah-lewis-racial-bias-photography.html\">faces of light-skinned people</a>. The consequences can be severe. In January, a Black man in Detroit named Robert Williams was arrested for <a href=\"https://www.nytimes.com/2020/06/24/technology/facial-recognition-arrest.html\">a crime he did not commit</a> because of an incorrect facial-recognition match.",
		css: ""
	},
	{
		type: "text",
		value: "Artificial intelligence can make our lives easier, but ultimately it is as flawed as we are, because we are behind all of it. Humans choose how A.I. systems are made and what data they are exposed to. We choose the voices that teach virtual assistants to hear, leading these systems <a href=\"https://www.washingtonpost.com/graphics/2018/business/alexa-does-not-understand-your-accent/\">not to understand people</a> with accents. We design a computer program to predict a personâ€™s criminal behavior by feeding it data about past rulings made by human judges â€” and in the process <a href=\"https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing\">baking in those judgesâ€™ biases</a>. We label the images that train computers to see; they then associate <a href=\"https://www.nytimes.com/2019/09/20/arts/design/imagenet-trevor-paglen-ai-facial-recognition.html\">glasses with â€œdweebsâ€ or â€œnerds.</a>â€",
		css: ""
	},
	{
		type: "subhed",
		value: "You can spot some of the mistakes and patterns we found that our A.I. system repeated when it was conjuring fake faces.",
		css: ""
	},
	{
		type: "scrollingvideo",
		value: {
			id: "scrolling_video_defects",
			framerate: "30",
			framelength: "600",
			startscroll: "0",
			endscroll: "0.9",
			heightdesktop: "0.6",
			heightmobile: "0.5",
			desktop: "1024,1024",
			mobile: "800,800",
			"asset-max-width": "fullbleed",
			hed: "",
			sources: "",
			credit: "",
			asset: "",
			rendition_asset: "",
			single_frames: "",
			slides: [
				{
					text: "Fashion accessories can cause problems.",
					percent: "0.03",
					fallbackdesktop: "spotting/earrings.jpg",
					fallbackmobile: "spotting/earrings-mobile.jpg"
				},
				{
					text: "Earrings, for example, might look similar but often may not exactly match.",
					percent: "0.10",
					fallbackdesktop: "spotting/earrings-overlay.jpg",
					fallbackmobile: "spotting/earrings-overlay-mobile.jpg"
				},
				{
					text: "GANs typically train on real photographs that have been centered, scaled and cropped.",
					percent: "0.17",
					fallbackdesktop: "spotting/center.jpg",
					fallbackmobile: "spotting/center-mobile.jpg"
				},
				{
					text: "As a result, each eye may be the same distance from the center.",
					percent: "0.25",
					fallbackdesktop: "spotting/center-overlay.jpg",
					fallbackmobile: "spotting/center-overlay-mobile.jpg"
				},
				{
					text: "Glasses are common accessories in many of the fake pictures.",
					percent: "0.333",
					fallbackdesktop: "spotting/glasses.jpg",
					fallbackmobile: "spotting/glasses-mobile.jpg"
				},
				{
					text: "They tend to have thin frames, with end pieces that may not match.",
					percent: "0.416",
					fallbackdesktop: "spotting/glasses-overlay.jpg",
					fallbackmobile: "spotting/glasses-overlay-mobile.jpg"
				},
				{
					text: "Most of us donâ€™t have perfectly symmetrical features, and the system is good at recreating them.",
					percent: "0.499",
					fallbackdesktop: "spotting/ears.jpg",
					fallbackmobile: "spotting/ears-mobile.jpg"
				},
				{
					text: "But as a result, it can produce deep indentations in one ear that may not be present in the other.",
					percent: "0.583",
					fallbackdesktop: "spotting/ears-overlay.jpg",
					fallbackmobile: "spotting/ears-overlay-mobile.jpg"
				},
				{
					text: "Then there are odder artifacts that can appear out of nowhere.",
					percent: "0.666",
					fallbackdesktop: "spotting/artifacts.jpg",
					fallbackmobile: "spotting/artifacts-mobile.jpg"
				},
				{
					text: "Most often theyâ€™re only in one part of the image, but if you look closely enough, itâ€™s hard to unsee it.",
					percent: "0.749",
					fallbackdesktop: "spotting/artifacts-overlay.jpg",
					fallbackmobile: "spotting/artifacts-overlay-mobile.jpg"
				},
				{
					text: "Sometimes, the clues about whether an image is fake arenâ€™t in a personâ€™s features.",
					percent: "0.83",
					fallbackdesktop: "spotting/backgrounds.jpg",
					fallbackmobile: "spotting/backgrounds-mobile.jpg"
				},
				{
					text: "Abstract or blurry backgrounds are often giveaways.",
					percent: "0.91",
					fallbackdesktop: "spotting/backgrounds-overlay.jpg",
					fallbackmobile: "spotting/backgrounds-overlay-mobile.jpg"
				}
			]
		},
		css: ""
	},
	{
		type: "text",
		value: "Humans err, of course: We overlook or glaze past the flaws in these systems, all too quick to trust that computers are hyper-rational, objective, always right. Studies have shown that, in situations where humans and computers must cooperate to make a decision â€” to identify <a href=\"https://eprints.soton.ac.uk/374599/1/AFIS%2520Bias.pdf\">fingerprints</a> or <a href=\"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7444527/\">human faces</a> â€” people <a href=\"https://onlinelibrary.wiley.com/doi/full/10.1111/cogs.12633\">consistently</a> made the wrong identification when a computer nudged them to do so. In the early days of dashboard GPS systems, drivers <a href=\"https://www.wsj.com/articles/SB120578983252543135\">famously followed the devicesâ€™ directions</a> to a fault, sending cars <a href=\"https://theweek.com/articles/464674/8-drivers-who-blindly-followed-gps-into-disaster\">into lakes, off cliffs and into trees</a>.",
		css: ""
	},
	{
		type: "text",
		value: "Is this humility or hubris? Do we place too little value in human intelligence â€” or do we overrate it, assuming we are so smart that we can create things smarter still?",
		css: ""
	},
	{
		type: "text",
		value: "The algorithms of Google and Bing sort the worldâ€™s knowledge for us. Facebookâ€™s newsfeed filters the updates from our social circles and decides which are important enough to show us. With self-driving features in cars, we are <a href=\"https://www.vox.com/recode/2020/2/26/21154502/tesla-autopilot-fatal-crashes\">putting our safety in the hands (and eyes)</a> of software. We place a lot of trust in these systems, but they can be as fallible as us.",
		css: ""
	},
	{
		type: "text",
		value: "<br>",
		css: ""
	},
	{
		type: "text",
		value: "<strong>More Articles on Artificial Intelligence:</strong>",
		css: ""
	},
	{
		type: "text",
		value: "<a href=\"https://www.nytimes.com/2020/11/11/science/bears-facial-recognition.html\">Training Facial Recognition on Some New Furry Friends: Bears</a>",
		css: ""
	},
	{
		type: "text",
		value: "<a href=\"https://www.nytimes.com/2020/11/21/science/coronavirus-antibodies-artificial-intelligence.html\">Antibodies Good. Machine-Made Molecules Better?</a>",
		css: ""
	},
	{
		type: "text",
		value: "<a href=\"https://www.nytimes.com/2020/11/20/health/tuberculosis-ai-apps.html\">These Algorithms Could Bring an End to the Worldâ€™s Deadliest Killer</a>",
		css: ""
	}
];
var DOC = {
	yml: yml,
	"overwrite-config-yml": "y",
	"top-asset": "",
	"top-asset-max-width": "",
	"use-lazy": "yes",
	body: body
};

const windowSize = () =>
{
    var body    = window.document.body,width  = window.document.documentElement.clientWidth,
        height  = window.document.documentElement.clientHeight,
        returnW = window.document.compatMode === "CSS1Compat" && width || body && body.clientWidth || width,
        returnH = window.document.compatMode === "CSS1Compat" && height || body && body.clientHeight || height;

    return { width: returnW, height: returnH };
};

let winWidth          = windowSize ().width,
    winHeight         = windowSize ().height,
    ratio             = winHeight / winWidth,
    aspect            = ratio > 1 ? "mobile" : "desktop",
    vidsLoaded        = 0,
    throttled         = false;

//TODO: add debug container
// "desktop": [960,1280,1600]
// "mobile": [640,800]

function create (obj)
{
  const scrollContainer = document.querySelector ("#" + obj["id"]).parentElement,
        video           = obj.vidEl,
        keyFrameLength  = (obj["keyFrameLength"] === undefined) ? 3     : Number.parseInt (obj["keyFrameLength"], 10),
        frameRate       = (obj["framerate"]      === undefined) ? 30    : Number.parseInt (obj["framerate"], 10),
        frameLength     = (obj["framelength"]    === undefined) ? 900   : Number.parseInt (obj["framelength"], 10),
        startScroll     = (obj["startscroll"]    === undefined) ? 0     : Number.parseFloat (obj["startscroll"]),
        endScroll       = (obj["endscroll"]      === undefined) ? 1     : Number.parseFloat (obj["endscroll"]),
        heightMultDesk  = (obj["heightdesktop"]  === undefined) ? 1.0   : Number.parseFloat (obj["heightdesktop"]),
        heightMultMob   = (obj["heightmobile"]   === undefined) ? 1.0   : Number.parseFloat (obj["heightmobile"]),
        desktopSizes    = (obj["desktop"]        === undefined) ? "960" : obj["desktop"],
        mobileSizes     = (obj["mobile"]         === undefined) ? "800" : obj["mobile"],
        controller      = new scrollmagic.Controller ({ container: isMobile () ? window : window }), // using #shell for mobile?
        scene           = new scrollmagic.Scene (
                            {
                              triggerElement: scrollContainer, 
                              triggerHook: "onCenter",
                              offset: -winHeight / 2
                            });

  let scrollPct        = 0,
      videoLastFrame   = 0,
      stepDivisor      = 10,
      videoShouldUpdate   = false,
      custTimer        = null,
      playThroughTimer = null,
      readyState       = false,
      fallbackImages   = [];

  obj.slides.forEach (
    function (value)
    {
      let height = value.height === undefined ? winHeight : Number.parseFloat (value.height) * winHeight;
    });

  obj.slides.forEach (
    function (value)
    {
      let height    = value.height === undefined ? winHeight : Number.parseFloat (value.height) * winHeight;

      if (value.type ===  "overlay") ;
    });

  window.addEventListener ("resize", function ()
    {
      if (!throttled)
      {
        scene.offset (-windowSize ().height / 2);
        scene.duration (scrollContainer.clientHeight + windowSize ().height);
        throttled = true;
        setTimeout (function () { throttled = false; }, 150);
      }  
    });

  const setupPage = () =>
  {
    let multi   = aspect === "desktop" ? heightMultDesk : heightMultMob,
        height  = frameRate * frameLength * multi, 
        holder  = document.querySelector ("#" + obj.id).parentElement,
        slides  = holder.querySelectorAll ("div.g-scrollingvideo-annotations > div");

    scrollContainer.style.height = height + "px";
    obj.addDebugElems = addDebugElems;

    obj.slides.forEach (
      function (value, index)
      {
        let parsePct = Number.parseFloat (obj.slides[index].percent),
            valPct   = isNaN (parsePct) ? 0 : parsePct,
            yPos     = obj.slides[index].percent !== undefined ? valPct * height : 0;

        //if (value.template === undefined)
        //{
          slides[index].style.height = "1px";
          slides[index].style.position  = "absolute";
          slides[index].style.top = yPos + "px";
        //}



        ///if (debugMode) console.log ("ffmpeg -y -i /Users/202855/projects/preview/2019-05-22-video-upload/public/_assets/rifle-spinning-1600.mp4 -ss " + displayTime (videoPct * frameLength) + " -qscale:v 10 -qscale:v 10 -vframes 1 /Users/202855/projects/preview/2019-06-26-assault-weapon-laws/public/_assets/fallback/fallback-desktop-" + ("00" + (index + 1)).slice (-2) + ".jpg -hide_banner");
      });
  };

  const addDebugElems = () =>
  {
    let multi   = aspect === "desktop" ? heightMultDesk : heightMultMob,
        height  = frameRate * frameLength * multi;

    for (let i = 0; i < 1; i += 0.01)
    {
      let holder         = document.querySelector ("#" + obj.id).parentElement,
          slideContainer = holder.querySelector ("div.g-scrollingvideo-annotations"),
          debugSlide     = document.createElement ("div");

      debugSlide.innerHTML       = i.toFixed (2), // + " | " + videoPct.toFixed (2) + " | " + displayTime (Math.floor (videoPct * frameLength));
      debugSlide.className       = "g-scrollingvideo-debug";
      debugSlide.style.height    = "1px";
      debugSlide.style.position  = "absolute";
      debugSlide.style.top       = (height * i) + "px";

      slideContainer.appendChild (debugSlide);
    }
  };

  const startScrollAnimation = () =>
  {
    scene.addTo (controller)
         .duration (scrollContainer.clientHeight + winHeight)
         .on ("progress", (e) =>
          {
            if (e.state === "BEFORE" || e.state === "AFTER") videoShouldUpdate = false;
            if (e.state === "DURING") ;
            else hideAllElements (e.state);

            if (scrollPct !== e.progress)
            {
              //if (scrollCallback !== null) scrollCallback (obj["id"], scrollPct);
              scrollPct = e.progress;
              if (!videoShouldUpdate) adjustScrollPct ();
            }
         })
        .on ("enter", (e) => { })
        .on ("leave", (e) => { hideAllElements (e.state); });
  };

  const hideAllElements = (state) =>
  {
  };

  const updateStill = (pct) =>
  {
    obj.stillImage.classList.remove ("g-show");
    obj.stillImage.style.opacity = 0;

    if (typeof obj.single_frames !== 'undefined')
    {
      let frameToUse = Math.floor (pct),
          frameStr = "00000" + frameToUse,
          frameCut = frameStr.substring (frameStr.length - 5, frameStr.length),
          frameUrl = obj.single_frames + "-" + obj.size + "-" + frameCut + ".jpg"; // -1600-00429.jpg

      obj.stillImage.onload = function()
      {
        obj.stillImage.classList.add ("g-show");
        obj.stillImage.style.opacity = 0;
        obj.stillImage.style.opacity = 1.0;
      };

      obj.stillImage.src = frameUrl;
    }
  };

  // const checkOverlays = (pct) =>
  // {
  //   let overlayFound = false;

  //   overlayRanges.forEach (
  //     function (range)
  //     {
  //       if (pct >= range[0] && pct <= range[1])
  //       {
  //         document.querySelector (".g-scrollingvideo-overlay").classList.add ("g-show");
  //         overlayFound = true;
  //       }
  //     });

  //   if (!overlayFound) document.querySelector (".g-scrollingvideo-overlay").classList.remove ("g-show");
  // };

  const jumpToTime = (pct) =>
  {

    let videoNextFrame   = frameLength * pct,
        videoCurrFrame   = videoLastFrame + ((videoNextFrame - videoLastFrame) / stepDivisor),
        //videoSnapFrame   = getClosestKeyframe (videoCurrFrame, keyFrameLength),
        frameToUse       = videoCurrFrame < 0 ? 0 : videoCurrFrame > frameLength ? frameLength : videoCurrFrame,
        isBuffered       = checkBuffered (frameToUse);

    if (isBuffered)
    {
      hideFallback ();
      frameToUse          = checkForPauses (frameToUse, pct);
      let timeFromKeyrame = getTimeFromKeyframe (frameToUse);
      video.currentTime   = timeFromKeyrame < 0 ? 0 : timeFromKeyrame > frameLength ? frameLength : timeFromKeyrame;

      if (Math.abs (videoNextFrame - frameToUse) < keyFrameLength + 1)
      {
        videoShouldUpdate = false;
        updateStill (frameToUse);
      }
      else
      {
        obj.stillImage.style.opacity = 0;
        obj.stillImage.classList.remove ("g-show");
        videoShouldUpdate = true;
      }
    }
    else
    {
      showFallback ();
    }

    videoLastFrame = frameToUse;
  };

  const getTimeFromKeyframe = (keyframe) =>
  {
    return keyframe / frameRate;
  };

  const adjustScrollPct = () =>
  {
    clearTimeout (custTimer);

    let jumpToPct = 0;

    if (scrollPct > startScroll && scrollPct < endScroll)
    {
      let adjustedPct = (scrollPct - startScroll) / (endScroll - startScroll);
      jumpToPct = adjustedPct > 1 ? 1 : adjustedPct < 0 ? 0 : adjustedPct;
    }
    else if (scrollPct >= endScroll) jumpToPct = 1;

    setTimeout (function () { jumpToTime (jumpToPct); }, 10);
  };

  const checkBuffered = (frameToUse) =>
  {

    if (!readyState) return false;

    let fallbackLen   = obj.slides.length,
        fallbackRange = { start: 0, end: 0 },
        currPct       = frameToUse / frameLength,
        bufferedLen   = video.buffered.length,
        isBuffered    = false;

    currPct = currPct < 0 ? 0 : currPct > 1 ? 1 : currPct;

    while (fallbackLen--)
    {
      if (fallbackImages[fallbackLen] === undefined) break;
      if (currPct > fallbackImages[fallbackLen].start)
      {
        let start = fallbackImages[fallbackLen].start,
            end   = fallbackLen === obj.slides.length - 1 ? 1 : parseFloat (fallbackImages[fallbackLen + 1].start);

        fallbackRange.start = start;
        fallbackRange.end   = end;
        break;
      }
    } 

    while (bufferedLen--)
    {
      let buffStart = video.buffered.start (bufferedLen),
          buffEnd   = video.buffered.end (bufferedLen);
      if (currPct >= buffStart && currPct <= buffEnd)
      {
        if (fallbackRange.start >= buffStart && fallbackRange.end <= buffEnd)
        {
          isBuffered = true;
          break;
        }
      }
    }

    return isBuffered;
  };

  const checkForPauses = (frameToUse, pct) =>
  {
    if (obj.pauses !== undefined)
    {
      let pausesLen = obj.pauses.length;

      while (pausesLen--)
      {
        if (pct > obj.pauses[pausesLen].start &&
            pct < obj.pauses[pausesLen].end)
        {
          let adjNextFrame = frameLength * obj.pauses[pausesLen].start,
              adjCurFrame  = videoLastFrame + ((adjNextFrame - videoLastFrame) / stepDivisor);
              
          return adjCurFrame;
        }
      }
    }

    return frameToUse;
  };

//   const findXY = (x, y) =>
//   {
//     let origX     = dim.srcWidth * x,
//         adjPctX   = (origX - (dim.overflowX  / 2)) / (dim.srcWidth - dim.overflowX) * 100,
//         origY     = dim.srcHeight * y,
//         adjPctY   = (origY - (dim.overflowY / 2)) / (dim.srcHeight - dim.overflowY) * 100,
//         pctX      = dim.curRatioWH < dim.srcRatioWH ? adjPctX : x * 100,
//         pctY      = dim.curRatioWH > dim.srcRatioWH ? adjPctY : y * 100;

//     return { x: pctX, y: pctY };
//   }

//   const findOffsetXY = (x, y, w, h, scaleX, scaleY, absolute) =>
//   {
//     let widthScaledX      = w * scaleX,
//         halfWidthScaledX  = widthScaledX / 2,
//         halfWidthAbs      = (halfWidthScaledX / dim.curWidth) * 100,
//         widthMultRel      = dim.curRatioWH < dim.srcRatioWH ? dim.srcWidth / (dim.srcWidth - dim.overflowX ) : 1,
//         halfWidthRel      = (halfWidthScaledX * widthMultRel) * 100,
//         heightScaledY     = h * scaleY,
//         halfHeightScaledY = heightScaledY / 2,
//         halfHeightAbs     = (halfHeightScaledY / dim.curHeight) * 100, 
//         heightMultRel     = dim.curRatioWH > dim.srcRatioWH ? dim.srcHeight / (dim.srcHeight - dim.overflowY) : 1,
//         halfHeightRel     = (halfHeightScaledY * heightMultRel) * 100,
//         offsetX           = absolute ? x - halfWidthAbs : x - halfWidthRel,
//         offsetY           = absolute ? y - halfHeightAbs : y - halfHeightRel;

//         return { x: offsetX, y: offsetY };
//   }

//   const findWH = (w, h, scaleX, scaleY, absolute) =>
//   {
//     let widthScaledX      = w * scaleX,
// // halfWidthScaledX  = widthScaledX / 2,
// // halfWidthAbs      = (halfWidthScaledX / curWidth) * 100, 
//         fullWidthAbs      = (widthScaledX / dim.curWidth) * 100, 
//         widthMultRel      = dim.curRatioWH < dim.srcRatioWH ? dim.srcWidth / (dim.srcWidth - dim.overflowX ) : 1,
// // halfWidthRel      = (halfWidthScaledX * widthMultRel) * 100,
//         fullWidthRel      = (widthScaledX * widthMultRel) * 100,
//         heightScaledY     = h * scaleY,
// // halfHeightScaledY = heightScaledY / 2,
// // halfHeightAbs     = (halfHeightScaledY / dim.curHeight) * 100, 
//         fullHeightAbs     = (heightScaledY / dim.curHeight) * 100, 
//         heightMultRel     = dim.curRatioWH > dim.srcRatioWH ? dim.srcHeight / (dim.srcHeight - dim.overflowY) : 1,
// // halfHeightRel     = (halfHeightScaledY * heightMultRel) * 100,
//         fullHeightRel     = (heightScaledY * heightMultRel) * 100,
// // offsetX           = elem.absolute ? pctX - halfWidthAbs : pctX - halfWidthRel,
// // offsetY           = elem.absolute ? pctY - halfHeightAbs : pctY - halfHeightRel,
//         width        = absolute ? fullWidthAbs : fullWidthRel, 
//         height       = absolute ? fullHeightAbs : fullHeightRel;

//         return { w: width, h: height };
//   };

  // const findDimensions = (elem, frame, valX, valY) =>
  // {
  //   let curWidth          = video.clientWidth,
  //       curHeight         = video.clientHeight,
  //       srcWidth          = video.videoWidth,
  //       srcHeight         = video.videoHeight,
  //       curRatioWH        = curWidth / curHeight,
  //       srcRatioWH        = srcWidth / srcHeight,
  //       curRatioHW        = curHeight / curWidth,
  //       srcRatioHW        = srcHeight / srcWidth,
  //       frameOffset       = frame - elem.start,
  //       posX              = elem.pos.length > 2 ? elem.pos[frameOffset][0] : elem.pos[0], // fix > 2 to check for animated coords
  //       posY              = elem.pos.length > 2 ? elem.pos[frameOffset][1] : elem.pos[1],
  //       scaleX            = elem.scale.length > 2 ? elem.scale[frameOffset][0] : elem.scale[0],
  //       scaleY            = elem.scale.length > 2 ? elem.scale[frameOffset][1] : elem.scale[1],
  //       origX             = srcWidth * posX,
  //       overflowX         = (srcHeight * srcRatioWH) - (srcHeight * curRatioWH),
  //       adjPctX           = (origX - (overflowX / 2)) / (srcWidth - overflowX) * 100,
  //       origY             = srcHeight * posY,
  //       overflowY         = (srcWidth * srcRatioHW) - (srcWidth * curRatioHW),
  //       adjPctY           = (origY - (overflowY / 2)) / (srcHeight - overflowY) * 100,
  //       pctX              = curRatioWH < srcRatioWH ? adjPctX : posX * 100,
  //       pctY              = curRatioWH > srcRatioWH ? adjPctY : posY * 100,
  //       widthScaledX      = !!elem.attributes[valX] ? elem.attributes[valX] * scaleX : elem[valX] * scaleX,
  //       halfWidthScaledX  = widthScaledX / 2,
  //       halfWidthAbs      = (halfWidthScaledX / curWidth) * 100, 
  //       fullWidthAbs      = (widthScaledX / curWidth) * 100, 
  //       widthMultRel      = curRatioWH < srcRatioWH ? srcWidth / (srcWidth - overflowX) : 1,
  //       halfWidthRel      = (halfWidthScaledX * widthMultRel) * 100,
  //       fullWidthRel      = (widthScaledX * widthMultRel) * 100,
  //       heightScaledY     = !!elem.attributes[valY] ? elem.attributes[valY] * scaleY : elem[valY] * scaleY,
  //       halfHeightScaledY = heightScaledY / 2,
  //       halfHeightAbs     = (halfHeightScaledY / curHeight) * 100, 
  //       fullHeightAbs     = (heightScaledY / curHeight) * 100, 
  //       heightMultRel     = curRatioWH > srcRatioWH ? srcHeight / (srcHeight - overflowY) : 1,
  //       halfHeightRel     = (halfHeightScaledY * heightMultRel) * 100,
  //       fullHeightRel     = (heightScaledY * heightMultRel) * 100,
  //       offsetX           = elem.absolute ? pctX - halfWidthAbs : pctX - halfWidthRel,
  //       offsetY           = elem.absolute ? pctY - halfHeightAbs : pctY - halfHeightRel,
  //       widthToUse        = elem.absolute ? fullWidthAbs : fullWidthRel, 
  //       heightToUse       = elem.absolute ? fullHeightAbs : fullHeightRel;

  //   return { x: pctX, y: pctY, offsetX: offsetX, offsetY: offsetY, width: widthToUse, height: heightToUse };
  // };

  // const moveLabels = (frame) =>
  // {
  //   let curWidth    = video.clientWidth,
  //       curHeight   = video.clientHeight,
  //       srcWidth    = video.videoWidth,
  //       srcHeight   = video.videoHeight,
  //       curRatio    = curWidth / curHeight,
  //       srcRatio    = srcWidth / srcHeight,
  //       closest     = Math.floor (frame);

  //   for (let label in _scrollingvideoLabels)
  //   {
  //     let labelObj = document.querySelector ("#" + obj["id"] + "_label_" + label);

  //     if (_scrollingvideoLabels.hasOwnProperty (label) &&
  //         closest >= 0 &&
  //         closest <= frameLength &&
  //         closest < _scrollingvideoLabels[label].length &&
  //         labelObj !== null)
  //     {
  //       let start    = labelObj.data.start,
  //           end      = labelObj.data.end,
  //           sizes    = labelObj.data.sizes.split (',').map (Number),
  //           videoPct = frame / frameLength,
  //           pctX     = _scrollingvideoLabels[label][closest][0],
  //           pctY     = _scrollingvideoLabels[label][closest][1];

  //       if (sizes.includes (obj.size))
  //       {
  //           let widthDiff = (srcWidth - curWidth) / 2,
  //           offPctX   = ((((pctX * srcWidth) - widthDiff) / ((widthDiff + curWidth) - widthDiff)) * curWidth) / curWidth;

  //           let heightDiff = (srcHeight - curHeight) / 2,
  //           offPctY   = ((((pctY * srcHeight) - heightDiff) / ((heightDiff + curHeight) - heightDiff)) * curHeight) / curHeight;



  //             // TODO this needs work to calculate the offset
  //             //pctX = curRatio < srcRatio ? ((pctX - 0.5) * srcRatio) + 0.5 : pctX;
  //             pctX = curRatio < srcRatio ? offPctX : pctX;
  //             //pctY = curRatio > srcRatio ? ((pctY - 0.5) * curRatio) + 0.5 : pctY;
  //             pctY = curRatio < srcRatio ? pctY : offPctY

  //         if (pctX !== undefined && pctY !== undefined &&
  //             pctX > 0 && pctX < 1 &&
  //             pctY > 0 && pctY < 1 &&
  //             labelObj !== undefined)
  //         {
  //           labelObj.style.transform = "translate3d(" + (pctX * curWidth) + "px," + (pctY * curHeight) + "px, 0)";

  //           if (videoPct >= start && videoPct <= end) labelObj.style.opacity = 1.0; //Math.abs (Math.sin (pctY * Math.PI)) + edgeLabelOpacity;
  //           else labelObj.style.opacity = 0;
  //         }
  //         else if (labelObj !== undefined) labelObj.style.opacity = 0;
  //       }
  //     }
  //   }
  // };

  const loadFallbackImages = (index, imagesArr) =>
  {
    if (index > imagesArr.length - 1)
    {
      return;
    }

    let holder    = document.querySelector ("#" + obj.id).parentElement,
        container = holder.querySelector ("div.g-scrollingvideo-fallback"),
        img       = document.createElement ("img"),
        fallback  = imagesArr[index],
        start     = imagesArr[index].percent;

    fallbackImages.push ({ start: start, image: img });
    container.append (img);

    img.onload = function ()
                 { 
                   if (!index) img.classList.add ("g-show");
                   setTimeout (function () { loadFallbackImages (++index, imagesArr); }, 100);
                 }; //function () { loadFallbackImages (++index, imagesArr) };
    img.src    = aspect === "desktop" ? "https://static01.nyt.com/newsgraphics/2020/11/12/fake-people/4b806cf591a8a76adfc88d19e90c8c634345bf3d/" + imagesArr[index].fallbackdesktop : "https://static01.nyt.com/newsgraphics/2020/11/12/fake-people/4b806cf591a8a76adfc88d19e90c8c634345bf3d/" + imagesArr[index].fallbackmobile;
  };

  const showFallback = () =>
  {
    fallbackImages.forEach (function (img, index)
    {
        if (scrollPct >= img.start && scrollPct > 0 || scrollPct < img.start && !index)
        {
          img.image.classList.add ("g-show");
        } 
        else img.image.classList.remove ("g-show");
    });

    video.style.opacity = 0;
    video.style.visibility = "hidden";
  };

  const hideFallback = () =>
  {
    fallbackImages.forEach (function (img, index)
    {
      img.image.classList.remove ("g-show");
    });

    video.style.opacity = 1;
    video.style.visibility = "visible";
  };

  video.addEventListener ("timeupdate", function ()
  {
    if (videoShouldUpdate) adjustScrollPct ();
    else clearTimeout (custTimer);
  });

  setupPage ();
  loadFallbackImages (0, obj.slides);

  playThroughTimer = setInterval (function ()
  {
    if (video.readyState > 3)
    {
      video.pause ();
      clearInterval (playThroughTimer);
      video.currentTime = 0;
      readyState = true;
    }
  }, 10);

  startScrollAnimation ();
}

function preventEvent (element, eventName, test)
{
  function handler (e)
  {
    if (!test || test (element, eventName))
    {
      e.stopImmediatePropagation ();
    }
  }

  element.addEventListener (eventName, handler);
  return handler;
}

const extend = (target, ...sources) =>
{
  let source = [];
  sources.forEach (src => { source = source.concat ([src, Object.getPrototypeOf (src)]); });
  return Object.assign (target, ...source);
};

function init ()
{
  let filtered      = DOC.body.filter (function (item) { return item.type === "scrollingvideo" }),
      videos        = filtered.map (function (vid)
      {
        let v          = document.createElement ("video"),
            stillImage = new Image();

        v.preload      = "auto";
        v.muted        = true;
        v.playsinline  = true;
        v.setAttribute ("playsinline", true);
        v.setAttribute ("autoplay", true);
          
        preventEvent (v, "seeking", function (el) { return });
        preventEvent (v, "seeked", function (el) { return });

        // let's try this hack for ios low power-- jon
        if (isIos ())
        {
          let playOnce = () =>
          {
            if (v)
            {
              v.play ();
              v.pause ();
              document.body.removeEventListener ("touchstart", playOnce);
            }
          };

          document.body.addEventListener ("touchstart", playOnce);
        }

        return extend (vid.value,
          {
            vidEl:       v,
            scrollSetup: false,
            stillImage: stillImage,
            // createLabels: createLabels,
            setSrc: function (loadCallback)
              {
                let url           = null,
                    loadNextVideo = null,
                    size          = null,
                    desktopSizes  = [],
                    mobileSizes   = [],
                    videoSizes    = {},
                    self          = this;

                document.getElementById (self["id"]).appendChild (self.vidEl);
                document.getElementById (self["id"]).appendChild (self.stillImage);
                create (self);

                // TODO: FALLBACK FOR SLOW LOADING OR ERROR
                loadNextVideo = setTimeout (next, 7500); // 7500

                self.vidEl.addEventListener ("canplaythrough", next, false);

                function next ()
                {
                  clearTimeout (loadNextVideo);
                  self.vidEl.pause ();
                  self.vidEl.removeEventListener ("canplaythrough", next);
                  loadCallback();
                }

                if (self.tracking)
                {
                  let trackingTimer = null;

                  function readJSON (file, callback)
                  {
                    let request = new XMLHttpRequest ();
                    request.overrideMimeType ("application/json");
                    request.open ("GET", file, true);

                    request.onreadystatechange = function () {
                      if (request.readyState === 4 && request.status == "200")
                      {
                          callback (request.responseText);
                      }
                    };
                    request.send (null);
                  }

                  readJSON ("https://static01.nyt.com/newsgraphics/2020/11/12/fake-people/4b806cf591a8a76adfc88d19e90c8c634345bf3d/" + self.tracking, function (text)
                  {
                    self.tracking = JSON.parse (text);

                    if (!!document.getElementById (self["id"]))
                    {
                      trackingTimer = setInterval (function ()
                      {
                        if (!!document.getElementById (self["id"]))
                        {
                          addTrackingElements (self);
                          clearInterval (trackingTimer);
                        }
                      }, 1000);

                      setTimeout (function () { clearInterval (trackingTimer); }, 10000); // give up after 10 seconds
                    }
                    else (addTrackingElements (self));
                  });
                }

                desktopSizes = self.desktop.split (",");
                mobileSizes  = self.mobile.split (",");

                videoSizes = { "desktop": desktopSizes, "mobile": mobileSizes };

                for (let i = desktopSizes.length; i--;) desktopSizes[i] = desktopSizes[i]|0;
                for (let i = mobileSizes.length; i--;) mobileSizes[i] = mobileSizes[i]|0;

                size = videoSizes[aspect].find (function (s) { return s * 1.1 > winWidth; });
                if (!size) size = videoSizes[aspect][videoSizes[aspect].length - 1];

                self.size = size;

                if (self.rendition_asset) url = self.rendition_asset + "-" + size + ".mp4";
                else url = self.asset;

                self.vidEl.src = url;
                self.vidEl.play ();
              }
          })
      });

  function loadVideosAsync ()
  {
    if (vidsLoaded < videos.length) videos[vidsLoaded].setSrc (loadVideosAsync);
    vidsLoaded++;
  }

  loadVideosAsync ();
}

const addTrackingElements = (obj) =>
{
  let pxArr  = ["stroke-width", "rx", "ry", "width", "height", "line-height", "margin-left", "margin-top", "letter-spacing", "font-size"],
      pctArr = ["rx", "ry", "width", "height", "margin-left", "margin-top"];

  Object.keys (obj.tracking).forEach (function (key)
  {
    if (obj.tracking[key].type === "rect"    ||
        obj.tracking[key].type === "ellipse" ||
        obj.tracking[key].type === "line"    ||
        obj.tracking[key].type === "path")
    {
      let svg   = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
      svg.setAttribute ("viewBox", "0 0 100 100");
      svg.setAttribute ("preserveAspectRatio", "none");

      var rect = document.createElementNS (svg.namespaceURI, obj.tracking[key].type);
          rect.id        = obj.id + "_tracking_" + key;
          rect.setAttribute ("class", "g-scrollingvideo-shape-hide");

      Object.keys (obj.tracking[key].attributes).forEach (function (attrKey)
      {
        let unit = pxArr.includes (attrKey) ? "px" : "";
        unit = (pctArr.includes (attrKey) && !obj.tracking[key].absolute) ? "%" : unit;
        rect.setAttribute (attrKey, obj.tracking[key].attributes[attrKey] + unit);
      });

      svg.appendChild(rect);
      obj.tracking[key].domElem = rect;
      document.querySelector ("#" + obj.id).appendChild (svg);
    }
    else if (obj.tracking[key].type === "label")
    {
      let label       = document.createElement ("div");
      label.id        = obj.id + "_tracking_" + key;
      // label.style     = "position: absolute; top: 0; left: 0; transition: opacity 0.25s linear;";
      label.className = "g-scrollingvideo-label";
      // label.class = "g-scrollingvideo-label";
      //label.style.marginLeft = "50px";
      label.innerHTML = obj.tracking[key].text;
      // nyt-franklin,arial,helvetica,sans-serif;
      // "nyt-imperial", georgia, "times new roman", times, serif
      // "nyt-cheltenham", georgia, "times new roman", times, serif;

      Object.keys (obj.tracking[key].attributes).forEach (function (attrKey)
      {
        let unit = pxArr.includes (attrKey) ? "px" : "";
        unit = pctArr.includes (attrKey) && !obj.tracking[key].absolute  ? "%" : unit;
        label.style[attrKey] = obj.tracking[key].attributes[attrKey] + unit;
      });

      obj.tracking[key].domElem = label;
      document.querySelector ("#" + obj["id"]).appendChild (label);
    }
    else if (obj.tracking[key].type === "image")
    {
      let image       = document.createElement ("img");
      image.id        = obj.id + "_tracking_" + key;
      image.className += "g-scrollingvideo-image";

      Object.keys (obj.tracking[key].attributes).forEach (function (attrKey)
      {
        let unit = pxArr.includes (attrKey) ? "px" : "";
        unit = pctArr.includes (attrKey) && !obj.tracking[key].absolute  ? "%" : unit;
        image.style[attrKey] = obj.tracking[key].attributes[attrKey] + unit;
      });

      obj.tracking[key].domElem = image;
      image.src = "https://static01.nyt.com/newsgraphics/2020/11/12/fake-people/4b806cf591a8a76adfc88d19e90c8c634345bf3d/" + obj.tracking[key].file;
      document.querySelector ("#" + obj["id"]).appendChild (image);
    }
  });
};

// let callback  = publicMethods.callback, 
//     labelRows = publicMethods.labelRows; 

var blah = init ();

// Freebird modules like images.js and videos.js are now

// NODE MODULES
// import _ from 'lodash';
// import $ from 'jquery';
// import * as d3 from 'd3';
// import * as d3 from 'd3-jetpack/d3-index.js';
// import { stateAbbrev } from '@nytg/graphics-toolkit';

// SCRIPTS
// import example from './scripts/example.js';

// TEMPLATES
// import templates from '../build/templates.js';

// WEBGL
// import createREGL from 'regl';
// import fragShader from './scripts/shaders/triangle.frag.glsl';

// ADS
// import './scripts/ads.js';

// WRITE YOUR JS HERE:



// console.clear();

// console.log('initial page state:', page.getState());


// text balance headline and subheds
// (consider doing this with CSS instead, which provides a significantly better user experience)
// import balanceText from './scripts/lib/balance-text.js';
// balanceText('.interactive-heading, .g-subhed');


console.clear ();

//document.addEventListener('keyup', (e) => { if (e.code === "KeyS") scrollingVideo.callback (scrollPct); });

//scrollingVideo.callback (scrollPct);
//document.querySelector ("body").style.backgroundColor = hexArr[0];
//window.addEventListener ("scroll", updateBackground); 

//var slider = document.getElementById("myRange");

const getSpritePos = function (value, depth)
{
  let val     = value - 1,
      square  = Math.sqrt (depth),
      floor   = Math.floor (val / square),
      extra   = val - floor,
      offsetX = (floor + extra) * -300,
      offsetY = floor * -300;

   return [offsetX, offsetY];
};

let filtered  = DOC.body.filter (function (item) { return item.type === "slider" }),
    sliders   = filtered.map (function (slider)
    {
      let rangeHandle  = document.querySelector ("#range_" + slider.value.id),
          sliderSprite = document.querySelector ("#" + slider.value.id + " .g-slider-sprite");

      sliderSprite.style.backgroundImage = "url('https://static01.nyt.com/newsgraphics/2020/11/12/fake-people/4b806cf591a8a76adfc88d19e90c8c634345bf3d/" + slider.value.background + "')";


      rangeHandle.oninput = function ()
      {
        let offset = getSpritePos (this.value, slider.value.depth);
        // let val     = this.value - 1,
        //     depth   = slider.value.depth,
        //     square  = Math.sqrt (depth),
        //     floor   = Math.floor (val / square),
        //     extra   = val - floor,
        //     offsetX = (floor + extra) * -300,
        //     offsetY = floor * -300;

        //sliderSprite.style.backgroundPosition = offsetX + "px " + offsetY +"px";
        sliderSprite.style.backgroundPosition = offset[0] + "px " + offset[1] +"px";
      };

      rangeHandle.value = parseInt (slider.value.index);
      let offset = getSpritePos (slider.value.index, slider.value.depth);
      sliderSprite.style.backgroundPosition = offset[0] + "px " + offset[1] +"px";

    return slider;
  });
//# sourceMappingURL=main.js.map