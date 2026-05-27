(function(k,C){typeof exports=="object"&&typeof module<"u"?module.exports=C():typeof define=="function"&&define.amd?define(C):(k=typeof globalThis<"u"?globalThis:k||self,k.RevealPeerJS=C())})(this,function(){"use strict";var Ns=Object.defineProperty;var Us=k=>{throw TypeError(k)};var Bs=(k,C,I)=>C in k?Ns(k,C,{enumerable:!0,configurable:!0,writable:!0,value:I}):k[C]=I;var Re=(k,C,I)=>Bs(k,typeof C!="symbol"?C+"":C,I);var Y=(k,C,I)=>C.has(k)?Us("Cannot add the same private member more than once"):C instanceof WeakSet?C.add(k):C.set(k,I);var Se,Te,je,Pe;function k(r,e){for(var t=0;t<e.length;t++){const s=e[t];if(typeof s!="string"&&!Array.isArray(s)){for(const n in s)if(n!=="default"&&!(n in r)){const i=Object.getOwnPropertyDescriptor(s,n);i&&Object.defineProperty(r,n,i.get?i:{enumerable:!0,get:()=>s[n]})}}}return Object.freeze(Object.defineProperty(r,Symbol.toStringTag,{value:"Module"}))}class C{constructor(){this.encoder=new TextEncoder,this._pieces=[],this._parts=[]}append_buffer(e){this.flush(),this._parts.push(e)}append(e){this._pieces.push(e)}flush(){if(this._pieces.length>0){const e=new Uint8Array(this._pieces);this._parts.push(e),this._pieces=[]}}toArrayBuffer(){const e=[];for(const t of this._parts)e.push(t);return I(e).buffer}}function I(r){let e=0;for(const n of r)e+=n.byteLength;const t=new Uint8Array(e);let s=0;for(const n of r){const i=new Uint8Array(n.buffer,n.byteOffset,n.byteLength);t.set(i,s),s+=n.byteLength}return t}function Ie(r){return new Ft(r).unpack()}function Le(r){const e=new Wt,t=e.pack(r);return t instanceof Promise?t.then(()=>e.getBuffer()):e.getBuffer()}class Ft{constructor(e){this.index=0,this.dataBuffer=e,this.dataView=new Uint8Array(this.dataBuffer),this.length=this.dataBuffer.byteLength}unpack(){const e=this.unpack_uint8();if(e<128)return e;if((e^224)<32)return(e^224)-32;let t;if((t=e^160)<=15)return this.unpack_raw(t);if((t=e^176)<=15)return this.unpack_string(t);if((t=e^144)<=15)return this.unpack_array(t);if((t=e^128)<=15)return this.unpack_map(t);switch(e){case 192:return null;case 193:return;case 194:return!1;case 195:return!0;case 202:return this.unpack_float();case 203:return this.unpack_double();case 204:return this.unpack_uint8();case 205:return this.unpack_uint16();case 206:return this.unpack_uint32();case 207:return this.unpack_uint64();case 208:return this.unpack_int8();case 209:return this.unpack_int16();case 210:return this.unpack_int32();case 211:return this.unpack_int64();case 212:return;case 213:return;case 214:return;case 215:return;case 216:return t=this.unpack_uint16(),this.unpack_string(t);case 217:return t=this.unpack_uint32(),this.unpack_string(t);case 218:return t=this.unpack_uint16(),this.unpack_raw(t);case 219:return t=this.unpack_uint32(),this.unpack_raw(t);case 220:return t=this.unpack_uint16(),this.unpack_array(t);case 221:return t=this.unpack_uint32(),this.unpack_array(t);case 222:return t=this.unpack_uint16(),this.unpack_map(t);case 223:return t=this.unpack_uint32(),this.unpack_map(t)}}unpack_uint8(){const e=this.dataView[this.index]&255;return this.index++,e}unpack_uint16(){const e=this.read(2),t=(e[0]&255)*256+(e[1]&255);return this.index+=2,t}unpack_uint32(){const e=this.read(4),t=((e[0]*256+e[1])*256+e[2])*256+e[3];return this.index+=4,t}unpack_uint64(){const e=this.read(8),t=((((((e[0]*256+e[1])*256+e[2])*256+e[3])*256+e[4])*256+e[5])*256+e[6])*256+e[7];return this.index+=8,t}unpack_int8(){const e=this.unpack_uint8();return e<128?e:e-256}unpack_int16(){const e=this.unpack_uint16();return e<32768?e:e-65536}unpack_int32(){const e=this.unpack_uint32();return e<2**31?e:e-2**32}unpack_int64(){const e=this.unpack_uint64();return e<2**63?e:e-2**64}unpack_raw(e){if(this.length<this.index+e)throw new Error(`BinaryPackFailure: index is out of range ${this.index} ${e} ${this.length}`);const t=this.dataBuffer.slice(this.index,this.index+e);return this.index+=e,t}unpack_string(e){const t=this.read(e);let s=0,n="",i,o;for(;s<e;)i=t[s],i<160?(o=i,s++):(i^192)<32?(o=(i&31)<<6|t[s+1]&63,s+=2):(i^224)<16?(o=(i&15)<<12|(t[s+1]&63)<<6|t[s+2]&63,s+=3):(o=(i&7)<<18|(t[s+1]&63)<<12|(t[s+2]&63)<<6|t[s+3]&63,s+=4),n+=String.fromCodePoint(o);return this.index+=e,n}unpack_array(e){const t=new Array(e);for(let s=0;s<e;s++)t[s]=this.unpack();return t}unpack_map(e){const t={};for(let s=0;s<e;s++){const n=this.unpack();t[n]=this.unpack()}return t}unpack_float(){const e=this.unpack_uint32(),t=e>>31,s=(e>>23&255)-127,n=e&8388607|8388608;return(t===0?1:-1)*n*2**(s-23)}unpack_double(){const e=this.unpack_uint32(),t=this.unpack_uint32(),s=e>>31,n=(e>>20&2047)-1023,o=(e&1048575|1048576)*2**(n-20)+t*2**(n-52);return(s===0?1:-1)*o}read(e){const t=this.index;if(t+e<=this.length)return this.dataView.subarray(t,t+e);throw new Error("BinaryPackFailure: read index out of range")}}class Wt{getBuffer(){return this._bufferBuilder.toArrayBuffer()}pack(e){if(typeof e=="string")this.pack_string(e);else if(typeof e=="number")Math.floor(e)===e?this.pack_integer(e):this.pack_double(e);else if(typeof e=="boolean")e===!0?this._bufferBuilder.append(195):e===!1&&this._bufferBuilder.append(194);else if(e===void 0)this._bufferBuilder.append(192);else if(typeof e=="object")if(e===null)this._bufferBuilder.append(192);else{const t=e.constructor;if(e instanceof Array){const s=this.pack_array(e);if(s instanceof Promise)return s.then(()=>this._bufferBuilder.flush())}else if(e instanceof ArrayBuffer)this.pack_bin(new Uint8Array(e));else if("BYTES_PER_ELEMENT"in e){const s=e;this.pack_bin(new Uint8Array(s.buffer,s.byteOffset,s.byteLength))}else if(e instanceof Date)this.pack_string(e.toString());else{if(e instanceof Blob)return e.arrayBuffer().then(s=>{this.pack_bin(new Uint8Array(s)),this._bufferBuilder.flush()});if(t==Object||t.toString().startsWith("class")){const s=this.pack_object(e);if(s instanceof Promise)return s.then(()=>this._bufferBuilder.flush())}else throw new Error(`Type "${t.toString()}" not yet supported`)}}else throw new Error(`Type "${typeof e}" not yet supported`);this._bufferBuilder.flush()}pack_bin(e){const t=e.length;if(t<=15)this.pack_uint8(160+t);else if(t<=65535)this._bufferBuilder.append(218),this.pack_uint16(t);else if(t<=4294967295)this._bufferBuilder.append(219),this.pack_uint32(t);else throw new Error("Invalid length");this._bufferBuilder.append_buffer(e)}pack_string(e){const t=this._textEncoder.encode(e),s=t.length;if(s<=15)this.pack_uint8(176+s);else if(s<=65535)this._bufferBuilder.append(216),this.pack_uint16(s);else if(s<=4294967295)this._bufferBuilder.append(217),this.pack_uint32(s);else throw new Error("Invalid length");this._bufferBuilder.append_buffer(t)}pack_array(e){const t=e.length;if(t<=15)this.pack_uint8(144+t);else if(t<=65535)this._bufferBuilder.append(220),this.pack_uint16(t);else if(t<=4294967295)this._bufferBuilder.append(221),this.pack_uint32(t);else throw new Error("Invalid length");const s=n=>{if(n<t){const i=this.pack(e[n]);return i instanceof Promise?i.then(()=>s(n+1)):s(n+1)}};return s(0)}pack_integer(e){if(e>=-32&&e<=127)this._bufferBuilder.append(e&255);else if(e>=0&&e<=255)this._bufferBuilder.append(204),this.pack_uint8(e);else if(e>=-128&&e<=127)this._bufferBuilder.append(208),this.pack_int8(e);else if(e>=0&&e<=65535)this._bufferBuilder.append(205),this.pack_uint16(e);else if(e>=-32768&&e<=32767)this._bufferBuilder.append(209),this.pack_int16(e);else if(e>=0&&e<=4294967295)this._bufferBuilder.append(206),this.pack_uint32(e);else if(e>=-2147483648&&e<=2147483647)this._bufferBuilder.append(210),this.pack_int32(e);else if(e>=-9223372036854776e3&&e<=9223372036854776e3)this._bufferBuilder.append(211),this.pack_int64(e);else if(e>=0&&e<=18446744073709552e3)this._bufferBuilder.append(207),this.pack_uint64(e);else throw new Error("Invalid integer")}pack_double(e){let t=0;e<0&&(t=1,e=-e);const s=Math.floor(Math.log(e)/Math.LN2),n=e/2**s-1,i=Math.floor(n*2**52),o=2**32,a=t<<31|s+1023<<20|i/o&1048575,c=i%o;this._bufferBuilder.append(203),this.pack_int32(a),this.pack_int32(c)}pack_object(e){const t=Object.keys(e),s=t.length;if(s<=15)this.pack_uint8(128+s);else if(s<=65535)this._bufferBuilder.append(222),this.pack_uint16(s);else if(s<=4294967295)this._bufferBuilder.append(223),this.pack_uint32(s);else throw new Error("Invalid length");const n=i=>{if(i<t.length){const o=t[i];if(e.hasOwnProperty(o)){this.pack(o);const a=this.pack(e[o]);if(a instanceof Promise)return a.then(()=>n(i+1))}return n(i+1)}};return n(0)}pack_uint8(e){this._bufferBuilder.append(e)}pack_uint16(e){this._bufferBuilder.append(e>>8),this._bufferBuilder.append(e&255)}pack_uint32(e){const t=e&4294967295;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255)}pack_uint64(e){const t=e/4294967296,s=e%2**32;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255),this._bufferBuilder.append((s&4278190080)>>>24),this._bufferBuilder.append((s&16711680)>>>16),this._bufferBuilder.append((s&65280)>>>8),this._bufferBuilder.append(s&255)}pack_int8(e){this._bufferBuilder.append(e&255)}pack_int16(e){this._bufferBuilder.append((e&65280)>>8),this._bufferBuilder.append(e&255)}pack_int32(e){this._bufferBuilder.append(e>>>24&255),this._bufferBuilder.append((e&16711680)>>>16),this._bufferBuilder.append((e&65280)>>>8),this._bufferBuilder.append(e&255)}pack_int64(e){const t=Math.floor(e/4294967296),s=e%2**32;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255),this._bufferBuilder.append((s&4278190080)>>>24),this._bufferBuilder.append((s&16711680)>>>16),this._bufferBuilder.append((s&65280)>>>8),this._bufferBuilder.append(s&255)}constructor(){this._bufferBuilder=new C,this._textEncoder=new TextEncoder}}let Me=!0,De=!0;function U(r,e,t){const s=r.match(e);return s&&s.length>=t&&parseFloat(s[t],10)}function A(r,e,t){if(!r.RTCPeerConnection)return;if(!Object.getOwnPropertyDescriptor(EventTarget.prototype,"addEventListener").writable){ie("Unable to polyfill events");return}const n=r.RTCPeerConnection.prototype,i=n.addEventListener;n.addEventListener=function(a,c){if(a!==e)return i.apply(this,arguments);const l=p=>{const h=t(p);h&&(c.handleEvent?c.handleEvent(h):c(h))};return this._eventMap=this._eventMap||{},this._eventMap[e]||(this._eventMap[e]=new Map),this._eventMap[e].set(c,l),i.apply(this,[a,l])};const o=n.removeEventListener;n.removeEventListener=function(a,c){if(a!==e||!this._eventMap||!this._eventMap[e])return o.apply(this,arguments);if(!this._eventMap[e].has(c))return o.apply(this,arguments);const l=this._eventMap[e].get(c);return this._eventMap[e].delete(c),this._eventMap[e].size===0&&delete this._eventMap[e],Object.keys(this._eventMap).length===0&&delete this._eventMap,o.apply(this,[a,l])},Object.defineProperty(n,"on"+e,{get(){return this["_on"+e]},set(a){this["_on"+e]&&(this.removeEventListener(e,this["_on"+e]),delete this["_on"+e]),a&&this.addEventListener(e,this["_on"+e]=a)},enumerable:!0,configurable:!0})}function qt(r){return typeof r!="boolean"?new Error("Argument type: "+typeof r+". Please use a boolean."):(Me=r,r?"adapter.js logging disabled":"adapter.js logging enabled")}function Yt(r){return typeof r!="boolean"?new Error("Argument type: "+typeof r+". Please use a boolean."):(De=!r,"adapter.js deprecation warnings "+(r?"disabled":"enabled"))}function ie(){if(typeof window=="object"){if(Me)return;typeof console<"u"&&typeof console.log=="function"&&console.log.apply(console,arguments)}}function oe(r,e){De&&console.warn(r+" is deprecated, please use "+e+" instead.")}function Gt(r){const e={browser:null,version:null};if(typeof r>"u"||!r.navigator||!r.navigator.userAgent)return e.browser="Not a browser.",e;const{navigator:t}=r;if(t.userAgentData&&t.userAgentData.brands){const s=t.userAgentData.brands.find(n=>n.brand==="Chromium");if(s)return{browser:"chrome",version:parseInt(s.version,10)}}if(t.mozGetUserMedia)e.browser="firefox",e.version=parseInt(U(t.userAgent,/Firefox\/(\d+)\./,1));else if(t.webkitGetUserMedia||r.isSecureContext===!1&&r.webkitRTCPeerConnection)e.browser="chrome",e.version=parseInt(U(t.userAgent,/Chrom(e|ium)\/(\d+)\./,2))||null;else if(r.RTCPeerConnection&&t.userAgent.match(/AppleWebKit\/(\d+)\./))e.browser="safari",e.version=parseInt(U(t.userAgent,/AppleWebKit\/(\d+)\./,1)),e.supportsUnifiedPlan=r.RTCRtpTransceiver&&"currentDirection"in r.RTCRtpTransceiver.prototype,e._safariVersion=U(t.userAgent,/Version\/(\d+(\.?\d+))/,1);else return e.browser="Not a supported browser.",e;return e}function Ae(r){return Object.prototype.toString.call(r)==="[object Object]"}function we(r){return Ae(r)?Object.keys(r).reduce(function(e,t){const s=Ae(r[t]),n=s?we(r[t]):r[t],i=s&&!Object.keys(n).length;return n===void 0||i?e:Object.assign(e,{[t]:n})},{}):r}function ae(r,e,t){!e||t.has(e.id)||(t.set(e.id,e),Object.keys(e).forEach(s=>{s.endsWith("Id")?ae(r,r.get(e[s]),t):s.endsWith("Ids")&&e[s].forEach(n=>{ae(r,r.get(n),t)})}))}function Oe(r,e,t){const s=t?"outbound-rtp":"inbound-rtp",n=new Map;if(e===null)return n;const i=[];return r.forEach(o=>{o.type==="track"&&o.trackIdentifier===e.id&&i.push(o)}),i.forEach(o=>{r.forEach(a=>{a.type===s&&a.trackId===o.id&&ae(r,a,n)})}),n}const $e=ie;function He(r,e){const t=r&&r.navigator;if(!t.mediaDevices)return;const s=function(a){if(typeof a!="object"||a.mandatory||a.optional)return a;const c={};return Object.keys(a).forEach(l=>{if(l==="require"||l==="advanced"||l==="mediaSource")return;const p=typeof a[l]=="object"?a[l]:{ideal:a[l]};p.exact!==void 0&&typeof p.exact=="number"&&(p.min=p.max=p.exact);const h=function(d,g){return d?d+g.charAt(0).toUpperCase()+g.slice(1):g==="deviceId"?"sourceId":g};if(p.ideal!==void 0){c.optional=c.optional||[];let d={};typeof p.ideal=="number"?(d[h("min",l)]=p.ideal,c.optional.push(d),d={},d[h("max",l)]=p.ideal,c.optional.push(d)):(d[h("",l)]=p.ideal,c.optional.push(d))}p.exact!==void 0&&typeof p.exact!="number"?(c.mandatory=c.mandatory||{},c.mandatory[h("",l)]=p.exact):["min","max"].forEach(d=>{p[d]!==void 0&&(c.mandatory=c.mandatory||{},c.mandatory[h(d,l)]=p[d])})}),a.advanced&&(c.optional=(c.optional||[]).concat(a.advanced)),c},n=function(a,c){if(e.version>=61)return c(a);if(a=JSON.parse(JSON.stringify(a)),a&&typeof a.audio=="object"){const l=function(p,h,d){h in p&&!(d in p)&&(p[d]=p[h],delete p[h])};a=JSON.parse(JSON.stringify(a)),l(a.audio,"autoGainControl","googAutoGainControl"),l(a.audio,"noiseSuppression","googNoiseSuppression"),a.audio=s(a.audio)}if(a&&typeof a.video=="object"){let l=a.video.facingMode;l=l&&(typeof l=="object"?l:{ideal:l});const p=e.version<66;if(l&&(l.exact==="user"||l.exact==="environment"||l.ideal==="user"||l.ideal==="environment")&&!(t.mediaDevices.getSupportedConstraints&&t.mediaDevices.getSupportedConstraints().facingMode&&!p)){delete a.video.facingMode;let h;if(l.exact==="environment"||l.ideal==="environment"?h=["back","rear"]:(l.exact==="user"||l.ideal==="user")&&(h=["front"]),h)return t.mediaDevices.enumerateDevices().then(d=>{d=d.filter(b=>b.kind==="videoinput");let g=d.find(b=>h.some(u=>b.label.toLowerCase().includes(u)));return!g&&d.length&&h.includes("back")&&(g=d[d.length-1]),g&&(a.video.deviceId=l.exact?{exact:g.deviceId}:{ideal:g.deviceId}),a.video=s(a.video),$e("chrome: "+JSON.stringify(a)),c(a)})}a.video=s(a.video)}return $e("chrome: "+JSON.stringify(a)),c(a)},i=function(a){return e.version>=64?a:{name:{PermissionDeniedError:"NotAllowedError",PermissionDismissedError:"NotAllowedError",InvalidStateError:"NotAllowedError",DevicesNotFoundError:"NotFoundError",ConstraintNotSatisfiedError:"OverconstrainedError",TrackStartError:"NotReadableError",MediaDeviceFailedDueToShutdown:"NotAllowedError",MediaDeviceKillSwitchOn:"NotAllowedError",TabCaptureError:"AbortError",ScreenCaptureError:"AbortError",DeviceCaptureError:"AbortError"}[a.name]||a.name,message:a.message,constraint:a.constraint||a.constraintName,toString(){return this.name+(this.message&&": ")+this.message}}},o=function(a,c,l){n(a,p=>{t.webkitGetUserMedia(p,c,h=>{l&&l(i(h))})})};if(t.getUserMedia=o.bind(t),t.mediaDevices.getUserMedia){const a=t.mediaDevices.getUserMedia.bind(t.mediaDevices);t.mediaDevices.getUserMedia=function(c){return n(c,l=>a(l).then(p=>{if(l.audio&&!p.getAudioTracks().length||l.video&&!p.getVideoTracks().length)throw p.getTracks().forEach(h=>{h.stop()}),new DOMException("","NotFoundError");return p},p=>Promise.reject(i(p))))}}}function Ne(r){r.MediaStream=r.MediaStream||r.webkitMediaStream}function Ue(r,e){if(!(e.version>102))if(typeof r=="object"&&r.RTCPeerConnection&&!("ontrack"in r.RTCPeerConnection.prototype)){Object.defineProperty(r.RTCPeerConnection.prototype,"ontrack",{get(){return this._ontrack},set(s){this._ontrack&&this.removeEventListener("track",this._ontrack),this.addEventListener("track",this._ontrack=s)},enumerable:!0,configurable:!0});const t=r.RTCPeerConnection.prototype.setRemoteDescription;r.RTCPeerConnection.prototype.setRemoteDescription=function(){return this._ontrackpoly||(this._ontrackpoly=n=>{n.stream.addEventListener("addtrack",i=>{let o;r.RTCPeerConnection.prototype.getReceivers?o=this.getReceivers().find(c=>c.track&&c.track.id===i.track.id):o={track:i.track};const a=new Event("track");a.track=i.track,a.receiver=o,a.transceiver={receiver:o},a.streams=[n.stream],this.dispatchEvent(a)}),n.stream.getTracks().forEach(i=>{let o;r.RTCPeerConnection.prototype.getReceivers?o=this.getReceivers().find(c=>c.track&&c.track.id===i.id):o={track:i};const a=new Event("track");a.track=i,a.receiver=o,a.transceiver={receiver:o},a.streams=[n.stream],this.dispatchEvent(a)})},this.addEventListener("addstream",this._ontrackpoly)),t.apply(this,arguments)}}else A(r,"track",t=>(t.transceiver||Object.defineProperty(t,"transceiver",{value:{receiver:t.receiver}}),t))}function Be(r){if(typeof r=="object"&&r.RTCPeerConnection&&!("getSenders"in r.RTCPeerConnection.prototype)&&"createDTMFSender"in r.RTCPeerConnection.prototype){const e=function(n,i){return{track:i,get dtmf(){return this._dtmf===void 0&&(i.kind==="audio"?this._dtmf=n.createDTMFSender(i):this._dtmf=null),this._dtmf},_pc:n}};if(!r.RTCPeerConnection.prototype.getSenders){r.RTCPeerConnection.prototype.getSenders=function(){return this._senders=this._senders||[],this._senders.slice()};const n=r.RTCPeerConnection.prototype.addTrack;r.RTCPeerConnection.prototype.addTrack=function(a,c){let l=n.apply(this,arguments);return l||(l=e(this,a),this._senders.push(l)),l};const i=r.RTCPeerConnection.prototype.removeTrack;r.RTCPeerConnection.prototype.removeTrack=function(a){i.apply(this,arguments);const c=this._senders.indexOf(a);c!==-1&&this._senders.splice(c,1)}}const t=r.RTCPeerConnection.prototype.addStream;r.RTCPeerConnection.prototype.addStream=function(i){this._senders=this._senders||[],t.apply(this,[i]),i.getTracks().forEach(o=>{this._senders.push(e(this,o))})};const s=r.RTCPeerConnection.prototype.removeStream;r.RTCPeerConnection.prototype.removeStream=function(i){this._senders=this._senders||[],s.apply(this,[i]),i.getTracks().forEach(o=>{const a=this._senders.find(c=>c.track===o);a&&this._senders.splice(this._senders.indexOf(a),1)})}}else if(typeof r=="object"&&r.RTCPeerConnection&&"getSenders"in r.RTCPeerConnection.prototype&&"createDTMFSender"in r.RTCPeerConnection.prototype&&r.RTCRtpSender&&!("dtmf"in r.RTCRtpSender.prototype)){const e=r.RTCPeerConnection.prototype.getSenders;r.RTCPeerConnection.prototype.getSenders=function(){const s=e.apply(this,[]);return s.forEach(n=>n._pc=this),s},Object.defineProperty(r.RTCRtpSender.prototype,"dtmf",{get(){return this._dtmf===void 0&&(this.track.kind==="audio"?this._dtmf=this._pc.createDTMFSender(this.track):this._dtmf=null),this._dtmf}})}}function ze(r,e){if(e.version>=67||!(typeof r=="object"&&r.RTCPeerConnection&&r.RTCRtpSender&&r.RTCRtpReceiver))return;if(!("getStats"in r.RTCRtpSender.prototype)){const s=r.RTCPeerConnection.prototype.getSenders;s&&(r.RTCPeerConnection.prototype.getSenders=function(){const o=s.apply(this,[]);return o.forEach(a=>a._pc=this),o});const n=r.RTCPeerConnection.prototype.addTrack;n&&(r.RTCPeerConnection.prototype.addTrack=function(){const o=n.apply(this,arguments);return o._pc=this,o}),r.RTCRtpSender.prototype.getStats=function(){const o=this;return this._pc.getStats().then(a=>Oe(a,o.track,!0))}}if(!("getStats"in r.RTCRtpReceiver.prototype)){const s=r.RTCPeerConnection.prototype.getReceivers;s&&(r.RTCPeerConnection.prototype.getReceivers=function(){const i=s.apply(this,[]);return i.forEach(o=>o._pc=this),i}),A(r,"track",n=>(n.receiver._pc=n.srcElement,n)),r.RTCRtpReceiver.prototype.getStats=function(){const i=this;return this._pc.getStats().then(o=>Oe(o,i.track,!1))}}if(!("getStats"in r.RTCRtpSender.prototype&&"getStats"in r.RTCRtpReceiver.prototype))return;const t=r.RTCPeerConnection.prototype.getStats;r.RTCPeerConnection.prototype.getStats=function(){if(arguments.length>0&&arguments[0]instanceof r.MediaStreamTrack){const n=arguments[0];let i,o,a;return this.getSenders().forEach(c=>{c.track===n&&(i?a=!0:i=c)}),this.getReceivers().forEach(c=>(c.track===n&&(o?a=!0:o=c),c.track===n)),a||i&&o?Promise.reject(new DOMException("There are more than one sender or receiver for the track.","InvalidAccessError")):i?i.getStats():o?o.getStats():Promise.reject(new DOMException("There is no sender or receiver for the track.","InvalidAccessError"))}return t.apply(this,arguments)}}function Fe(r){r.RTCPeerConnection.prototype.getLocalStreams=function(){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},Object.keys(this._shimmedLocalStreams).map(o=>this._shimmedLocalStreams[o][0])};const e=r.RTCPeerConnection.prototype.addTrack;r.RTCPeerConnection.prototype.addTrack=function(o,a){if(!a)return e.apply(this,arguments);this._shimmedLocalStreams=this._shimmedLocalStreams||{};const c=e.apply(this,arguments);return this._shimmedLocalStreams[a.id]?this._shimmedLocalStreams[a.id].indexOf(c)===-1&&this._shimmedLocalStreams[a.id].push(c):this._shimmedLocalStreams[a.id]=[a,c],c};const t=r.RTCPeerConnection.prototype.addStream;r.RTCPeerConnection.prototype.addStream=function(o){this._shimmedLocalStreams=this._shimmedLocalStreams||{},o.getTracks().forEach(l=>{if(this.getSenders().find(h=>h.track===l))throw new DOMException("Track already exists.","InvalidAccessError")});const a=this.getSenders();t.apply(this,arguments);const c=this.getSenders().filter(l=>a.indexOf(l)===-1);this._shimmedLocalStreams[o.id]=[o].concat(c)};const s=r.RTCPeerConnection.prototype.removeStream;r.RTCPeerConnection.prototype.removeStream=function(o){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},delete this._shimmedLocalStreams[o.id],s.apply(this,arguments)};const n=r.RTCPeerConnection.prototype.removeTrack;r.RTCPeerConnection.prototype.removeTrack=function(o){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},o&&Object.keys(this._shimmedLocalStreams).forEach(a=>{const c=this._shimmedLocalStreams[a].indexOf(o);c!==-1&&this._shimmedLocalStreams[a].splice(c,1),this._shimmedLocalStreams[a].length===1&&delete this._shimmedLocalStreams[a]}),n.apply(this,arguments)}}function We(r,e){if(!r.RTCPeerConnection)return;if(r.RTCPeerConnection.prototype.addTrack&&e.version>=65)return Fe(r);const t=r.RTCPeerConnection.prototype.getLocalStreams;r.RTCPeerConnection.prototype.getLocalStreams=function(){const p=t.apply(this);return this._reverseStreams=this._reverseStreams||{},p.map(h=>this._reverseStreams[h.id])};const s=r.RTCPeerConnection.prototype.addStream;r.RTCPeerConnection.prototype.addStream=function(p){if(this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},p.getTracks().forEach(h=>{if(this.getSenders().find(g=>g.track===h))throw new DOMException("Track already exists.","InvalidAccessError")}),!this._reverseStreams[p.id]){const h=new r.MediaStream(p.getTracks());this._streams[p.id]=h,this._reverseStreams[h.id]=p,p=h}s.apply(this,[p])};const n=r.RTCPeerConnection.prototype.removeStream;r.RTCPeerConnection.prototype.removeStream=function(p){this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},n.apply(this,[this._streams[p.id]||p]),delete this._reverseStreams[this._streams[p.id]?this._streams[p.id].id:p.id],delete this._streams[p.id]},r.RTCPeerConnection.prototype.addTrack=function(p,h){if(this.signalingState==="closed")throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");const d=[].slice.call(arguments,1);if(d.length!==1||!d[0].getTracks().find(u=>u===p))throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.","NotSupportedError");if(this.getSenders().find(u=>u.track===p))throw new DOMException("Track already exists.","InvalidAccessError");this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{};const b=this._streams[h.id];if(b)b.addTrack(p),Promise.resolve().then(()=>{this.dispatchEvent(new Event("negotiationneeded"))});else{const u=new r.MediaStream([p]);this._streams[h.id]=u,this._reverseStreams[u.id]=h,this.addStream(u)}return this.getSenders().find(u=>u.track===p)};function i(l,p){let h=p.sdp;return Object.keys(l._reverseStreams||[]).forEach(d=>{const g=l._reverseStreams[d],b=l._streams[g.id];h=h.replace(new RegExp(b.id,"g"),g.id)}),new RTCSessionDescription({type:p.type,sdp:h})}function o(l,p){let h=p.sdp;return Object.keys(l._reverseStreams||[]).forEach(d=>{const g=l._reverseStreams[d],b=l._streams[g.id];h=h.replace(new RegExp(g.id,"g"),b.id)}),new RTCSessionDescription({type:p.type,sdp:h})}["createOffer","createAnswer"].forEach(function(l){const p=r.RTCPeerConnection.prototype[l],h={[l](){const d=arguments;return arguments.length&&typeof arguments[0]=="function"?p.apply(this,[b=>{const u=i(this,b);d[0].apply(null,[u])},b=>{d[1]&&d[1].apply(null,b)},arguments[2]]):p.apply(this,arguments).then(b=>i(this,b))}};r.RTCPeerConnection.prototype[l]=h[l]});const a=r.RTCPeerConnection.prototype.setLocalDescription;r.RTCPeerConnection.prototype.setLocalDescription=function(){return!arguments.length||!arguments[0].type?a.apply(this,arguments):(arguments[0]=o(this,arguments[0]),a.apply(this,arguments))};const c=Object.getOwnPropertyDescriptor(r.RTCPeerConnection.prototype,"localDescription");Object.defineProperty(r.RTCPeerConnection.prototype,"localDescription",{get(){const l=c.get.apply(this);return l.type===""?l:i(this,l)}}),r.RTCPeerConnection.prototype.removeTrack=function(p){if(this.signalingState==="closed")throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");if(!p._pc)throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.","TypeError");if(!(p._pc===this))throw new DOMException("Sender was not created by this connection.","InvalidAccessError");this._streams=this._streams||{};let d;Object.keys(this._streams).forEach(g=>{this._streams[g].getTracks().find(u=>p.track===u)&&(d=this._streams[g])}),d&&(d.getTracks().length===1?this.removeStream(this._reverseStreams[d.id]):d.removeTrack(p.track),this.dispatchEvent(new Event("negotiationneeded")))}}function ce(r,e){!r.RTCPeerConnection&&r.webkitRTCPeerConnection&&(r.RTCPeerConnection=r.webkitRTCPeerConnection),r.RTCPeerConnection&&e.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){const s=r.RTCPeerConnection.prototype[t],n={[t](){return arguments[0]=new(t==="addIceCandidate"?r.RTCIceCandidate:r.RTCSessionDescription)(arguments[0]),s.apply(this,arguments)}};r.RTCPeerConnection.prototype[t]=n[t]})}function qe(r,e){e.version>102||A(r,"negotiationneeded",t=>{const s=t.target;if(!((e.version<72||s.getConfiguration&&s.getConfiguration().sdpSemantics==="plan-b")&&s.signalingState!=="stable"))return t})}const Ye=Object.freeze(Object.defineProperty({__proto__:null,fixNegotiationNeeded:qe,shimAddTrackRemoveTrack:We,shimAddTrackRemoveTrackWithNative:Fe,shimGetSendersWithDtmf:Be,shimGetUserMedia:He,shimMediaStream:Ne,shimOnTrack:Ue,shimPeerConnection:ce,shimSenderReceiverGetStats:ze},Symbol.toStringTag,{value:"Module"}));function Ge(r,e){const t=r&&r.navigator,s=r&&r.MediaStreamTrack;if(t.getUserMedia=function(n,i,o){oe("navigator.getUserMedia","navigator.mediaDevices.getUserMedia"),t.mediaDevices.getUserMedia(n).then(i,o)},!(e.version>55&&"autoGainControl"in t.mediaDevices.getSupportedConstraints())){const n=function(o,a,c){a in o&&!(c in o)&&(o[c]=o[a],delete o[a])},i=t.mediaDevices.getUserMedia.bind(t.mediaDevices);if(t.mediaDevices.getUserMedia=function(o){return typeof o=="object"&&typeof o.audio=="object"&&(o=JSON.parse(JSON.stringify(o)),n(o.audio,"autoGainControl","mozAutoGainControl"),n(o.audio,"noiseSuppression","mozNoiseSuppression")),i(o)},s&&s.prototype.getSettings){const o=s.prototype.getSettings;s.prototype.getSettings=function(){const a=o.apply(this,arguments);return n(a,"mozAutoGainControl","autoGainControl"),n(a,"mozNoiseSuppression","noiseSuppression"),a}}if(s&&s.prototype.applyConstraints){const o=s.prototype.applyConstraints;s.prototype.applyConstraints=function(a){return this.kind==="audio"&&typeof a=="object"&&(a=JSON.parse(JSON.stringify(a)),n(a,"autoGainControl","mozAutoGainControl"),n(a,"noiseSuppression","mozNoiseSuppression")),o.apply(this,[a])}}}}function Vt(r,e){r.navigator.mediaDevices&&"getDisplayMedia"in r.navigator.mediaDevices||r.navigator.mediaDevices&&(r.navigator.mediaDevices.getDisplayMedia=function(s){if(!(s&&s.video)){const n=new DOMException("getDisplayMedia without video constraints is undefined");return n.name="NotFoundError",n.code=8,Promise.reject(n)}return s.video===!0?s.video={mediaSource:e}:s.video.mediaSource=e,r.navigator.mediaDevices.getUserMedia(s)})}function Ve(r){typeof r=="object"&&r.RTCTrackEvent&&"receiver"in r.RTCTrackEvent.prototype&&!("transceiver"in r.RTCTrackEvent.prototype)&&Object.defineProperty(r.RTCTrackEvent.prototype,"transceiver",{get(){return{receiver:this.receiver}}})}function le(r,e){typeof r!="object"||!(r.RTCPeerConnection||r.mozRTCPeerConnection)||(!r.RTCPeerConnection&&r.mozRTCPeerConnection&&(r.RTCPeerConnection=r.mozRTCPeerConnection),e.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){const s=r.RTCPeerConnection.prototype[t],n={[t](){return arguments[0]=new(t==="addIceCandidate"?r.RTCIceCandidate:r.RTCSessionDescription)(arguments[0]),s.apply(this,arguments)}};r.RTCPeerConnection.prototype[t]=n[t]}))}function Je(r,e){if(typeof r!="object"||!(r.RTCPeerConnection||r.mozRTCPeerConnection)||e.version>=151)return;const t={inboundrtp:"inbound-rtp",outboundrtp:"outbound-rtp",candidatepair:"candidate-pair",localcandidate:"local-candidate",remotecandidate:"remote-candidate"},s=r.RTCPeerConnection.prototype.getStats;r.RTCPeerConnection.prototype.getStats=function(){const[i,o,a]=arguments;return this.signalingState==="closed"?Promise.resolve(new Map):s.apply(this,[i||null]).then(c=>{if(e.version<53&&!o)try{c.forEach(l=>{l.type=t[l.type]||l.type})}catch(l){if(l.name!=="TypeError")throw l;c.forEach((p,h)=>{c.set(h,Object.assign({},p,{type:t[p.type]||p.type}))})}return c}).then(o,a)}}function Xe(r){if(!(typeof r=="object"&&r.RTCPeerConnection&&r.RTCRtpSender)||r.RTCRtpSender&&"getStats"in r.RTCRtpSender.prototype)return;const e=r.RTCPeerConnection.prototype.getSenders;e&&(r.RTCPeerConnection.prototype.getSenders=function(){const n=e.apply(this,[]);return n.forEach(i=>i._pc=this),n});const t=r.RTCPeerConnection.prototype.addTrack;t&&(r.RTCPeerConnection.prototype.addTrack=function(){const n=t.apply(this,arguments);return n._pc=this,n}),r.RTCRtpSender.prototype.getStats=function(){return this.track?this._pc.getStats(this.track):Promise.resolve(new Map)}}function Ke(r){if(!(typeof r=="object"&&r.RTCPeerConnection&&r.RTCRtpSender)||r.RTCRtpSender&&"getStats"in r.RTCRtpReceiver.prototype)return;const e=r.RTCPeerConnection.prototype.getReceivers;e&&(r.RTCPeerConnection.prototype.getReceivers=function(){const s=e.apply(this,[]);return s.forEach(n=>n._pc=this),s}),A(r,"track",t=>(t.receiver._pc=t.srcElement,t)),r.RTCRtpReceiver.prototype.getStats=function(){return this._pc.getStats(this.track)}}function Qe(r){!r.RTCPeerConnection||"removeStream"in r.RTCPeerConnection.prototype||(r.RTCPeerConnection.prototype.removeStream=function(t){oe("removeStream","removeTrack"),this.getSenders().forEach(s=>{s.track&&t.getTracks().includes(s.track)&&this.removeTrack(s)})})}function Ze(r){r.DataChannel&&!r.RTCDataChannel&&(r.RTCDataChannel=r.DataChannel)}function et(r){if(!(typeof r=="object"&&r.RTCPeerConnection))return;const e=r.RTCPeerConnection.prototype.addTransceiver;e&&(r.RTCPeerConnection.prototype.addTransceiver=function(){this.setParametersPromises=[];let s=arguments[1]&&arguments[1].sendEncodings;s===void 0&&(s=[]),s=[...s];const n=s.length>0;n&&s.forEach(o=>{if("rid"in o&&!/^[a-z0-9]{0,16}$/i.test(o.rid))throw new TypeError("Invalid RID value provided.");if("scaleResolutionDownBy"in o&&!(parseFloat(o.scaleResolutionDownBy)>=1))throw new RangeError("scale_resolution_down_by must be >= 1.0");if("maxFramerate"in o&&!(parseFloat(o.maxFramerate)>=0))throw new RangeError("max_framerate must be >= 0.0")});const i=e.apply(this,arguments);if(n){const{sender:o}=i,a=o.getParameters();(!("encodings"in a)||a.encodings.length===1&&Object.keys(a.encodings[0]).length===0)&&(a.encodings=s,o.sendEncodings=s,this.setParametersPromises.push(o.setParameters(a).then(()=>{delete o.sendEncodings}).catch(()=>{delete o.sendEncodings})))}return i})}function tt(r){if(!(typeof r=="object"&&r.RTCRtpSender))return;const e=r.RTCRtpSender.prototype.getParameters;e&&(r.RTCRtpSender.prototype.getParameters=function(){const s=e.apply(this,arguments);return"encodings"in s||(s.encodings=[].concat(this.sendEncodings||[{}])),s})}function st(r){if(!(typeof r=="object"&&r.RTCPeerConnection))return;const e=r.RTCPeerConnection.prototype.createOffer;r.RTCPeerConnection.prototype.createOffer=function(){return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(()=>e.apply(this,arguments)).finally(()=>{this.setParametersPromises=[]}):e.apply(this,arguments)}}function nt(r){if(!(typeof r=="object"&&r.RTCPeerConnection))return;const e=r.RTCPeerConnection.prototype.createAnswer;r.RTCPeerConnection.prototype.createAnswer=function(){return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(()=>e.apply(this,arguments)).finally(()=>{this.setParametersPromises=[]}):e.apply(this,arguments)}}const rt=Object.freeze(Object.defineProperty({__proto__:null,shimAddTransceiver:et,shimCreateAnswer:nt,shimCreateOffer:st,shimGetDisplayMedia:Vt,shimGetParameters:tt,shimGetStats:Je,shimGetUserMedia:Ge,shimOnTrack:Ve,shimPeerConnection:le,shimRTCDataChannel:Ze,shimReceiverGetStats:Ke,shimRemoveStream:Qe,shimSenderGetStats:Xe},Symbol.toStringTag,{value:"Module"}));function it(r){if(!(typeof r!="object"||!r.RTCPeerConnection)){if("getLocalStreams"in r.RTCPeerConnection.prototype||(r.RTCPeerConnection.prototype.getLocalStreams=function(){return this._localStreams||(this._localStreams=[]),this._localStreams}),!("addStream"in r.RTCPeerConnection.prototype)){const e=r.RTCPeerConnection.prototype.addTrack;r.RTCPeerConnection.prototype.addStream=function(s){this._localStreams||(this._localStreams=[]),this._localStreams.includes(s)||this._localStreams.push(s),s.getAudioTracks().forEach(n=>e.call(this,n,s)),s.getVideoTracks().forEach(n=>e.call(this,n,s))},r.RTCPeerConnection.prototype.addTrack=function(s,...n){return n&&n.forEach(i=>{this._localStreams?this._localStreams.includes(i)||this._localStreams.push(i):this._localStreams=[i]}),e.apply(this,arguments)}}"removeStream"in r.RTCPeerConnection.prototype||(r.RTCPeerConnection.prototype.removeStream=function(t){this._localStreams||(this._localStreams=[]);const s=this._localStreams.indexOf(t);if(s===-1)return;this._localStreams.splice(s,1);const n=t.getTracks();this.getSenders().forEach(i=>{n.includes(i.track)&&this.removeTrack(i)})})}}function ot(r){if(!(typeof r!="object"||!r.RTCPeerConnection)&&("getRemoteStreams"in r.RTCPeerConnection.prototype||(r.RTCPeerConnection.prototype.getRemoteStreams=function(){return this._remoteStreams?this._remoteStreams:[]}),!("onaddstream"in r.RTCPeerConnection.prototype))){Object.defineProperty(r.RTCPeerConnection.prototype,"onaddstream",{get(){return this._onaddstream},set(t){this._onaddstream&&(this.removeEventListener("addstream",this._onaddstream),this.removeEventListener("track",this._onaddstreampoly)),this.addEventListener("addstream",this._onaddstream=t),this.addEventListener("track",this._onaddstreampoly=s=>{s.streams.forEach(n=>{if(this._remoteStreams||(this._remoteStreams=[]),this._remoteStreams.includes(n))return;this._remoteStreams.push(n);const i=new Event("addstream");i.stream=n,this.dispatchEvent(i)})})}});const e=r.RTCPeerConnection.prototype.setRemoteDescription;r.RTCPeerConnection.prototype.setRemoteDescription=function(){const s=this;return this._onaddstreampoly||this.addEventListener("track",this._onaddstreampoly=function(n){n.streams.forEach(i=>{if(s._remoteStreams||(s._remoteStreams=[]),s._remoteStreams.indexOf(i)>=0)return;s._remoteStreams.push(i);const o=new Event("addstream");o.stream=i,s.dispatchEvent(o)})}),e.apply(s,arguments)}}}function at(r){if(typeof r!="object"||!r.RTCPeerConnection)return;const e=r.RTCPeerConnection.prototype,t=e.createOffer,s=e.createAnswer,n=e.setLocalDescription,i=e.setRemoteDescription,o=e.addIceCandidate;e.createOffer=function(l,p){const h=arguments.length>=2?arguments[2]:arguments[0],d=t.apply(this,[h]);return p?(d.then(l,p),Promise.resolve()):d},e.createAnswer=function(l,p){const h=arguments.length>=2?arguments[2]:arguments[0],d=s.apply(this,[h]);return p?(d.then(l,p),Promise.resolve()):d};let a=function(c,l,p){const h=n.apply(this,[c]);return p?(h.then(l,p),Promise.resolve()):h};e.setLocalDescription=a,a=function(c,l,p){const h=i.apply(this,[c]);return p?(h.then(l,p),Promise.resolve()):h},e.setRemoteDescription=a,a=function(c,l,p){const h=o.apply(this,[c]);return p?(h.then(l,p),Promise.resolve()):h},e.addIceCandidate=a}function ct(r){const e=r&&r.navigator;if(e.mediaDevices&&e.mediaDevices.getUserMedia){const t=e.mediaDevices,s=t.getUserMedia.bind(t);e.mediaDevices.getUserMedia=n=>s(lt(n))}!e.getUserMedia&&e.mediaDevices&&e.mediaDevices.getUserMedia&&(e.getUserMedia=(function(s,n,i){e.mediaDevices.getUserMedia(s).then(n,i)}).bind(e))}function lt(r){return r&&r.video!==void 0?Object.assign({},r,{video:we(r.video)}):r}function pt(r){if(!r.RTCPeerConnection)return;const e=r.RTCPeerConnection;r.RTCPeerConnection=function(s,n){if(s&&s.iceServers){const i=[];for(let o=0;o<s.iceServers.length;o++){let a=s.iceServers[o];a.urls===void 0&&a.url?(oe("RTCIceServer.url","RTCIceServer.urls"),a=JSON.parse(JSON.stringify(a)),a.urls=a.url,delete a.url,i.push(a)):i.push(s.iceServers[o])}s.iceServers=i}return new e(s,n)},r.RTCPeerConnection.prototype=e.prototype,"generateCertificate"in e&&Object.defineProperty(r.RTCPeerConnection,"generateCertificate",{get(){return e.generateCertificate}})}function ht(r){typeof r=="object"&&r.RTCTrackEvent&&"receiver"in r.RTCTrackEvent.prototype&&!("transceiver"in r.RTCTrackEvent.prototype)&&Object.defineProperty(r.RTCTrackEvent.prototype,"transceiver",{get(){return{receiver:this.receiver}}})}function dt(r){const e=r.RTCPeerConnection.prototype.createOffer;r.RTCPeerConnection.prototype.createOffer=function(s){if(s){typeof s.offerToReceiveAudio<"u"&&(s.offerToReceiveAudio=!!s.offerToReceiveAudio);const n=this.getTransceivers().find(o=>o.receiver.track.kind==="audio");s.offerToReceiveAudio===!1&&n?n.direction==="sendrecv"?n.setDirection?n.setDirection("sendonly"):n.direction="sendonly":n.direction==="recvonly"&&(n.setDirection?n.setDirection("inactive"):n.direction="inactive"):s.offerToReceiveAudio===!0&&!n&&this.addTransceiver("audio",{direction:"recvonly"}),typeof s.offerToReceiveVideo<"u"&&(s.offerToReceiveVideo=!!s.offerToReceiveVideo);const i=this.getTransceivers().find(o=>o.receiver.track.kind==="video");s.offerToReceiveVideo===!1&&i?i.direction==="sendrecv"?i.setDirection?i.setDirection("sendonly"):i.direction="sendonly":i.direction==="recvonly"&&(i.setDirection?i.setDirection("inactive"):i.direction="inactive"):s.offerToReceiveVideo===!0&&!i&&this.addTransceiver("video",{direction:"recvonly"})}return e.apply(this,arguments)}}function ut(r){typeof r!="object"||r.AudioContext||(r.AudioContext=r.webkitAudioContext)}const ft=Object.freeze(Object.defineProperty({__proto__:null,shimAudioContext:ut,shimCallbacksAPI:at,shimConstraints:lt,shimCreateOfferLegacy:dt,shimGetUserMedia:ct,shimLocalStreamsAPI:it,shimRTCIceServerUrls:pt,shimRemoteStreamsAPI:ot,shimTrackEventTransceiver:ht},Symbol.toStringTag,{value:"Module"}));function Jt(r){return r&&r.__esModule&&Object.prototype.hasOwnProperty.call(r,"default")?r.default:r}var mt={exports:{}};(function(r){const e={};e.generateIdentifier=function(){return Math.random().toString(36).substring(2,12)},e.localCName=e.generateIdentifier(),e.splitLines=function(t){return t.trim().split(`
`).map(s=>s.trim())},e.splitSections=function(t){return t.split(`
m=`).map((n,i)=>(i>0?"m="+n:n).trim()+`\r
`)},e.getDescription=function(t){const s=e.splitSections(t);return s&&s[0]},e.getMediaSections=function(t){const s=e.splitSections(t);return s.shift(),s},e.matchPrefix=function(t,s){return e.splitLines(t).filter(n=>n.indexOf(s)===0)},e.parseCandidate=function(t){let s;t.indexOf("a=candidate:")===0?s=t.substring(12).split(" "):s=t.substring(10).split(" ");const n={foundation:s[0],component:{1:"rtp",2:"rtcp"}[s[1]]||s[1],protocol:s[2].toLowerCase(),priority:parseInt(s[3],10),ip:s[4],address:s[4],port:parseInt(s[5],10),type:s[7]};for(let i=8;i<s.length;i+=2)switch(s[i]){case"raddr":n.relatedAddress=s[i+1];break;case"rport":n.relatedPort=parseInt(s[i+1],10);break;case"tcptype":n.tcpType=s[i+1];break;case"ufrag":n.ufrag=s[i+1],n.usernameFragment=s[i+1];break;default:n[s[i]]===void 0&&(n[s[i]]=s[i+1]);break}return n},e.writeCandidate=function(t){const s=[];s.push(t.foundation);const n=t.component;n==="rtp"?s.push(1):n==="rtcp"?s.push(2):s.push(n),s.push(t.protocol.toUpperCase()),s.push(t.priority),s.push(t.address||t.ip),s.push(t.port);const i=t.type;return s.push("typ"),s.push(i),i!=="host"&&t.relatedAddress&&t.relatedPort!==void 0&&(s.push("raddr"),s.push(t.relatedAddress),s.push("rport"),s.push(t.relatedPort)),t.tcpType&&t.protocol.toLowerCase()==="tcp"&&(s.push("tcptype"),s.push(t.tcpType)),(t.usernameFragment||t.ufrag)&&(s.push("ufrag"),s.push(t.usernameFragment||t.ufrag)),"candidate:"+s.join(" ")},e.parseIceOptions=function(t){return t.substring(14).split(" ")},e.parseRtpMap=function(t){let s=t.substring(9).split(" ");const n={payloadType:parseInt(s.shift(),10)};return s=s[0].split("/"),n.name=s[0],n.clockRate=parseInt(s[1],10),n.channels=s.length===3?parseInt(s[2],10):1,n.numChannels=n.channels,n},e.writeRtpMap=function(t){let s=t.payloadType;t.preferredPayloadType!==void 0&&(s=t.preferredPayloadType);const n=t.channels||t.numChannels||1;return"a=rtpmap:"+s+" "+t.name+"/"+t.clockRate+(n!==1?"/"+n:"")+`\r
`},e.parseExtmap=function(t){const s=t.substring(9).split(" ");return{id:parseInt(s[0],10),direction:s[0].indexOf("/")>0?s[0].split("/")[1]:"sendrecv",uri:s[1],attributes:s.slice(2).join(" ")}},e.writeExtmap=function(t){return"a=extmap:"+(t.id||t.preferredId)+(t.direction&&t.direction!=="sendrecv"?"/"+t.direction:"")+" "+t.uri+(t.attributes?" "+t.attributes:"")+`\r
`},e.parseFmtp=function(t){const s={};let n;const i=t.substring(t.indexOf(" ")+1).split(";");for(let o=0;o<i.length;o++)n=i[o].trim().split("="),s[n[0].trim()]=n[1];return s},e.writeFmtp=function(t){let s="",n=t.payloadType;if(t.preferredPayloadType!==void 0&&(n=t.preferredPayloadType),t.parameters&&Object.keys(t.parameters).length){const i=[];Object.keys(t.parameters).forEach(o=>{t.parameters[o]!==void 0?i.push(o+"="+t.parameters[o]):i.push(o)}),s+="a=fmtp:"+n+" "+i.join(";")+`\r
`}return s},e.parseRtcpFb=function(t){const s=t.substring(t.indexOf(" ")+1).split(" ");return{type:s.shift(),parameter:s.join(" ")}},e.writeRtcpFb=function(t){let s="",n=t.payloadType;return t.preferredPayloadType!==void 0&&(n=t.preferredPayloadType),t.rtcpFeedback&&t.rtcpFeedback.length&&t.rtcpFeedback.forEach(i=>{s+="a=rtcp-fb:"+n+" "+i.type+(i.parameter&&i.parameter.length?" "+i.parameter:"")+`\r
`}),s},e.parseSsrcMedia=function(t){const s=t.indexOf(" "),n={ssrc:parseInt(t.substring(7,s),10)},i=t.indexOf(":",s);return i>-1?(n.attribute=t.substring(s+1,i),n.value=t.substring(i+1)):n.attribute=t.substring(s+1),n},e.parseSsrcGroup=function(t){const s=t.substring(13).split(" ");return{semantics:s.shift(),ssrcs:s.map(n=>parseInt(n,10))}},e.getMid=function(t){const s=e.matchPrefix(t,"a=mid:")[0];if(s)return s.substring(6)},e.parseFingerprint=function(t){const s=t.substring(14).split(" ");return{algorithm:s[0].toLowerCase(),value:s[1].toUpperCase()}},e.getDtlsParameters=function(t,s){return{role:"auto",fingerprints:e.matchPrefix(t+s,"a=fingerprint:").map(e.parseFingerprint)}},e.writeDtlsParameters=function(t,s){let n="a=setup:"+s+`\r
`;return t.fingerprints.forEach(i=>{n+="a=fingerprint:"+i.algorithm+" "+i.value+`\r
`}),n},e.parseCryptoLine=function(t){const s=t.substring(9).split(" ");return{tag:parseInt(s[0],10),cryptoSuite:s[1],keyParams:s[2],sessionParams:s.slice(3)}},e.writeCryptoLine=function(t){return"a=crypto:"+t.tag+" "+t.cryptoSuite+" "+(typeof t.keyParams=="object"?e.writeCryptoKeyParams(t.keyParams):t.keyParams)+(t.sessionParams?" "+t.sessionParams.join(" "):"")+`\r
`},e.parseCryptoKeyParams=function(t){if(t.indexOf("inline:")!==0)return null;const s=t.substring(7).split("|");return{keyMethod:"inline",keySalt:s[0],lifeTime:s[1],mkiValue:s[2]?s[2].split(":")[0]:void 0,mkiLength:s[2]?s[2].split(":")[1]:void 0}},e.writeCryptoKeyParams=function(t){return t.keyMethod+":"+t.keySalt+(t.lifeTime?"|"+t.lifeTime:"")+(t.mkiValue&&t.mkiLength?"|"+t.mkiValue+":"+t.mkiLength:"")},e.getCryptoParameters=function(t,s){return e.matchPrefix(t+s,"a=crypto:").map(e.parseCryptoLine)},e.getIceParameters=function(t,s){const n=e.matchPrefix(t+s,"a=ice-ufrag:")[0],i=e.matchPrefix(t+s,"a=ice-pwd:")[0];return n&&i?{usernameFragment:n.substring(12),password:i.substring(10)}:null},e.writeIceParameters=function(t){let s="a=ice-ufrag:"+t.usernameFragment+`\r
a=ice-pwd:`+t.password+`\r
`;return t.iceLite&&(s+=`a=ice-lite\r
`),s},e.parseRtpParameters=function(t){const s={codecs:[],headerExtensions:[],fecMechanisms:[],rtcp:[]},i=e.splitLines(t)[0].split(" ");s.profile=i[2];for(let a=3;a<i.length;a++){const c=i[a],l=e.matchPrefix(t,"a=rtpmap:"+c+" ")[0];if(l){const p=e.parseRtpMap(l),h=e.matchPrefix(t,"a=fmtp:"+c+" ");switch(p.parameters=h.length?e.parseFmtp(h[0]):{},p.rtcpFeedback=e.matchPrefix(t,"a=rtcp-fb:"+c+" ").map(e.parseRtcpFb),s.codecs.push(p),p.name.toUpperCase()){case"RED":case"ULPFEC":s.fecMechanisms.push(p.name.toUpperCase());break}}}e.matchPrefix(t,"a=extmap:").forEach(a=>{s.headerExtensions.push(e.parseExtmap(a))});const o=e.matchPrefix(t,"a=rtcp-fb:* ").map(e.parseRtcpFb);return s.codecs.forEach(a=>{o.forEach(c=>{a.rtcpFeedback.find(p=>p.type===c.type&&p.parameter===c.parameter)||a.rtcpFeedback.push(c)})}),s},e.writeRtpDescription=function(t,s){let n="";n+="m="+t+" ",n+=s.codecs.length>0?"9":"0",n+=" "+(s.profile||"UDP/TLS/RTP/SAVPF")+" ",n+=s.codecs.map(o=>o.preferredPayloadType!==void 0?o.preferredPayloadType:o.payloadType).join(" ")+`\r
`,n+=`c=IN IP4 0.0.0.0\r
`,n+=`a=rtcp:9 IN IP4 0.0.0.0\r
`,s.codecs.forEach(o=>{n+=e.writeRtpMap(o),n+=e.writeFmtp(o),n+=e.writeRtcpFb(o)});let i=0;return s.codecs.forEach(o=>{o.maxptime>i&&(i=o.maxptime)}),i>0&&(n+="a=maxptime:"+i+`\r
`),s.headerExtensions&&s.headerExtensions.forEach(o=>{n+=e.writeExtmap(o)}),n},e.parseRtpEncodingParameters=function(t){const s=[],n=e.parseRtpParameters(t),i=n.fecMechanisms.indexOf("RED")!==-1,o=n.fecMechanisms.indexOf("ULPFEC")!==-1,a=e.matchPrefix(t,"a=ssrc:").map(d=>e.parseSsrcMedia(d)).filter(d=>d.attribute==="cname"),c=a.length>0&&a[0].ssrc;let l;const p=e.matchPrefix(t,"a=ssrc-group:FID").map(d=>d.substring(17).split(" ").map(b=>parseInt(b,10)));p.length>0&&p[0].length>1&&p[0][0]===c&&(l=p[0][1]),n.codecs.forEach(d=>{if(d.name.toUpperCase()==="RTX"&&d.parameters.apt){let g={ssrc:c,codecPayloadType:parseInt(d.parameters.apt,10)};c&&l&&(g.rtx={ssrc:l}),s.push(g),i&&(g=JSON.parse(JSON.stringify(g)),g.fec={ssrc:c,mechanism:o?"red+ulpfec":"red"},s.push(g))}}),s.length===0&&c&&s.push({ssrc:c});let h=e.matchPrefix(t,"b=");return h.length&&(h[0].indexOf("b=TIAS:")===0?h=parseInt(h[0].substring(7),10):h[0].indexOf("b=AS:")===0?h=parseInt(h[0].substring(5),10)*1e3*.95-50*40*8:h=void 0,s.forEach(d=>{d.maxBitrate=h})),s},e.parseRtcpParameters=function(t){const s={},n=e.matchPrefix(t,"a=ssrc:").map(a=>e.parseSsrcMedia(a)).filter(a=>a.attribute==="cname")[0];n&&(s.cname=n.value,s.ssrc=n.ssrc);const i=e.matchPrefix(t,"a=rtcp-rsize");s.reducedSize=i.length>0,s.compound=i.length===0;const o=e.matchPrefix(t,"a=rtcp-mux");return s.mux=o.length>0,s},e.writeRtcpParameters=function(t){let s="";return t.reducedSize&&(s+=`a=rtcp-rsize\r
`),t.mux&&(s+=`a=rtcp-mux\r
`),t.ssrc!==void 0&&t.cname&&(s+="a=ssrc:"+t.ssrc+" cname:"+t.cname+`\r
`),s},e.parseMsid=function(t){let s;const n=e.matchPrefix(t,"a=msid:");if(n.length===1)return s=n[0].substring(7).split(" "),{stream:s[0],track:s[1]};const i=e.matchPrefix(t,"a=ssrc:").map(o=>e.parseSsrcMedia(o)).filter(o=>o.attribute==="msid");if(i.length>0)return s=i[0].value.split(" "),{stream:s[0],track:s[1]}},e.parseSctpDescription=function(t){const s=e.parseMLine(t),n=e.matchPrefix(t,"a=max-message-size:");let i;n.length>0&&(i=parseInt(n[0].substring(19),10)),isNaN(i)&&(i=65536);const o=e.matchPrefix(t,"a=sctp-port:");if(o.length>0)return{port:parseInt(o[0].substring(12),10),protocol:s.fmt,maxMessageSize:i};const a=e.matchPrefix(t,"a=sctpmap:");if(a.length>0){const c=a[0].substring(10).split(" ");return{port:parseInt(c[0],10),protocol:c[1],maxMessageSize:i}}},e.writeSctpDescription=function(t,s){let n=[];return t.protocol!=="DTLS/SCTP"?n=["m="+t.kind+" 9 "+t.protocol+" "+s.protocol+`\r
`,`c=IN IP4 0.0.0.0\r
`,"a=sctp-port:"+s.port+`\r
`]:n=["m="+t.kind+" 9 "+t.protocol+" "+s.port+`\r
`,`c=IN IP4 0.0.0.0\r
`,"a=sctpmap:"+s.port+" "+s.protocol+` 65535\r
`],s.maxMessageSize!==void 0&&n.push("a=max-message-size:"+s.maxMessageSize+`\r
`),n.join("")},e.generateSessionId=function(){return Math.random().toString().substr(2,22)},e.writeSessionBoilerplate=function(t,s,n){let i;const o=s!==void 0?s:2;return t?i=t:i=e.generateSessionId(),`v=0\r
o=`+(n||"thisisadapterortc")+" "+i+" "+o+` IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
`},e.getDirection=function(t,s){const n=e.splitLines(t);for(let i=0;i<n.length;i++)switch(n[i]){case"a=sendrecv":case"a=sendonly":case"a=recvonly":case"a=inactive":return n[i].substring(2)}return s?e.getDirection(s):"sendrecv"},e.getKind=function(t){return e.splitLines(t)[0].split(" ")[0].substring(2)},e.isRejected=function(t){return t.split(" ",2)[1]==="0"},e.parseMLine=function(t){const n=e.splitLines(t)[0].substring(2).split(" ");return{kind:n[0],port:parseInt(n[1],10),protocol:n[2],fmt:n.slice(3).join(" ")}},e.parseOLine=function(t){const n=e.matchPrefix(t,"o=")[0].substring(2).split(" ");return{username:n[0],sessionId:n[1],sessionVersion:parseInt(n[2],10),netType:n[3],addressType:n[4],address:n[5]}},e.isValidSDP=function(t){if(typeof t!="string"||t.length===0)return!1;const s=e.splitLines(t);for(let n=0;n<s.length;n++)if(s[n].length<2||s[n].charAt(1)!=="=")return!1;return!0},r.exports=e})(mt);var gt=mt.exports;const N=Jt(gt),Xt=k({__proto__:null,default:N},[gt]);function G(r){if(!r.RTCIceCandidate||r.RTCIceCandidate&&"foundation"in r.RTCIceCandidate.prototype)return;const e=r.RTCIceCandidate;r.RTCIceCandidate=function(s){if(typeof s=="object"&&s.candidate&&s.candidate.indexOf("a=")===0&&(s=JSON.parse(JSON.stringify(s)),s.candidate=s.candidate.substring(2)),s.candidate&&s.candidate.length){const n=new e(s),i=N.parseCandidate(s.candidate);for(const o in i)o in n||Object.defineProperty(n,o,{value:i[o]});return n.toJSON=function(){return{candidate:n.candidate,sdpMid:n.sdpMid,sdpMLineIndex:n.sdpMLineIndex,usernameFragment:n.usernameFragment}},n}return new e(s)},r.RTCIceCandidate.prototype=e.prototype,A(r,"icecandidate",t=>(t.candidate&&Object.defineProperty(t,"candidate",{value:new r.RTCIceCandidate(t.candidate),writable:"false"}),t))}function pe(r){!r.RTCIceCandidate||r.RTCIceCandidate&&"relayProtocol"in r.RTCIceCandidate.prototype||A(r,"icecandidate",e=>{if(e.candidate){const t=N.parseCandidate(e.candidate.candidate);t.type==="relay"&&(e.candidate.relayProtocol={0:"tls",1:"tcp",2:"udp"}[t.priority>>24])}return e})}function V(r,e){if(!r.RTCPeerConnection)return;"sctp"in r.RTCPeerConnection.prototype||Object.defineProperty(r.RTCPeerConnection.prototype,"sctp",{get(){return typeof this._sctp>"u"?null:this._sctp}});const t=function(a){if(!a||!a.sdp)return!1;const c=N.splitSections(a.sdp);return c.shift(),c.some(l=>{const p=N.parseMLine(l);return p&&p.kind==="application"&&p.protocol.indexOf("SCTP")!==-1})},s=function(a){const c=a.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);if(c===null||c.length<2)return-1;const l=parseInt(c[1],10);return l!==l?-1:l},n=function(a){let c=65536;return e.browser==="firefox"&&(e.version<57?a===-1?c=16384:c=2147483637:e.version<60?c=e.version===57?65535:65536:c=2147483637),c},i=function(a,c){let l=65536;e.browser==="firefox"&&e.version===57&&(l=65535);const p=N.matchPrefix(a.sdp,"a=max-message-size:");return p.length>0?l=parseInt(p[0].substring(19),10):e.browser==="firefox"&&c!==-1&&(l=2147483637),l},o=r.RTCPeerConnection.prototype.setRemoteDescription;r.RTCPeerConnection.prototype.setRemoteDescription=function(){if(this._sctp=null,e.browser==="chrome"&&e.version>=76){const{sdpSemantics:c}=this.getConfiguration();c==="plan-b"&&Object.defineProperty(this,"sctp",{get(){return typeof this._sctp>"u"?null:this._sctp},enumerable:!0,configurable:!0})}if(t(arguments[0])){const c=s(arguments[0]),l=n(c),p=i(arguments[0],c);let h;l===0&&p===0?h=Number.POSITIVE_INFINITY:l===0||p===0?h=Math.max(l,p):h=Math.min(l,p);const d={};Object.defineProperty(d,"maxMessageSize",{get(){return h}}),this._sctp=d}return o.apply(this,arguments)}}function J(r,e){if(!(r.RTCPeerConnection&&"createDataChannel"in r.RTCPeerConnection.prototype)||e.browser==="chrome"&&e.version>149||e.browser==="firefox"&&e.version>60)return;function t(n,i){const o=n.send;n.send=function(){const c=arguments[0],l=c.length||c.size||c.byteLength;if(n.readyState==="open"&&i.sctp&&l>i.sctp.maxMessageSize)throw new TypeError("Message too large (can send a maximum of "+i.sctp.maxMessageSize+" bytes)");return o.apply(n,arguments)}}const s=r.RTCPeerConnection.prototype.createDataChannel;r.RTCPeerConnection.prototype.createDataChannel=function(){const i=s.apply(this,arguments);return t(i,this),i},A(r,"datachannel",n=>(t(n.channel,n.target),n))}function he(r){if(!r.RTCPeerConnection||"connectionState"in r.RTCPeerConnection.prototype)return;const e=r.RTCPeerConnection.prototype;Object.defineProperty(e,"connectionState",{get(){return{completed:"connected",checking:"connecting"}[this.iceConnectionState]||this.iceConnectionState},enumerable:!0,configurable:!0}),Object.defineProperty(e,"onconnectionstatechange",{get(){return this._onconnectionstatechange||null},set(t){this._onconnectionstatechange&&(this.removeEventListener("connectionstatechange",this._onconnectionstatechange),delete this._onconnectionstatechange),t&&this.addEventListener("connectionstatechange",this._onconnectionstatechange=t)},enumerable:!0,configurable:!0}),["setLocalDescription","setRemoteDescription"].forEach(t=>{const s=e[t];e[t]=function(){return this._connectionstatechangepoly||(this._connectionstatechangepoly=n=>{const i=n.target;if(i._lastConnectionState!==i.connectionState){i._lastConnectionState=i.connectionState;const o=new Event("connectionstatechange",n);i.dispatchEvent(o)}return n},this.addEventListener("iceconnectionstatechange",this._connectionstatechangepoly)),s.apply(this,arguments)}})}function de(r,e){if(!r.RTCPeerConnection||e.browser==="chrome"&&e.version>=71||e.browser==="safari"&&e._safariVersion>=13.1)return;const t=r.RTCPeerConnection.prototype.setRemoteDescription;r.RTCPeerConnection.prototype.setRemoteDescription=function(n){if(n&&n.sdp&&n.sdp.indexOf(`
a=extmap-allow-mixed`)!==-1){const i=n.sdp.split(`
`).filter(o=>o.trim()!=="a=extmap-allow-mixed").join(`
`);r.RTCSessionDescription&&n instanceof r.RTCSessionDescription?arguments[0]=new r.RTCSessionDescription({type:n.type,sdp:i}):n.sdp=i}return t.apply(this,arguments)}}function X(r,e){if(!(r.RTCPeerConnection&&r.RTCPeerConnection.prototype))return;const t=r.RTCPeerConnection.prototype.addIceCandidate;!t||t.length===0||(r.RTCPeerConnection.prototype.addIceCandidate=function(){return arguments[0]?(e.browser==="chrome"&&e.version<78||e.browser==="firefox"&&e.version<68||e.browser==="safari")&&arguments[0]&&arguments[0].candidate===""?Promise.resolve():t.apply(this,arguments):(arguments[1]&&arguments[1].apply(null),Promise.resolve())})}function K(r,e){if(!(r.RTCPeerConnection&&r.RTCPeerConnection.prototype))return;const t=r.RTCPeerConnection.prototype.setLocalDescription;!t||t.length===0||(r.RTCPeerConnection.prototype.setLocalDescription=function(){let n=arguments[0]||{};if(typeof n!="object"||n.type&&n.sdp)return t.apply(this,arguments);if(n={type:n.type,sdp:n.sdp},!n.type)switch(this.signalingState){case"stable":case"have-local-offer":case"have-remote-pranswer":n.type="offer";break;default:n.type="answer";break}return n.sdp||n.type!=="offer"&&n.type!=="answer"?t.apply(this,[n]):(n.type==="offer"?this.createOffer:this.createAnswer).apply(this).then(o=>t.apply(this,[o]))})}const Kt=Object.freeze(Object.defineProperty({__proto__:null,removeExtmapAllowMixed:de,shimAddIceCandidateNullOrEmpty:X,shimConnectionState:he,shimMaxMessageSize:V,shimParameterlessSetLocalDescription:K,shimRTCIceCandidate:G,shimRTCIceCandidateRelayProtocol:pe,shimSendThrowTypeError:J},Symbol.toStringTag,{value:"Module"}));function Qt({window:r}={},e={shimChrome:!0,shimFirefox:!0,shimSafari:!0}){const t=ie,s=Gt(r),n={browserDetails:s,commonShim:Kt,extractVersion:U,disableLog:qt,disableWarnings:Yt,sdp:Xt};switch(s.browser){case"chrome":if(!Ye||!ce||!e.shimChrome)return t("Chrome shim is not included in this adapter release."),n;if(s.version===null)return t("Chrome shim can not determine version, not shimming."),n;t("adapter.js shimming chrome."),n.browserShim=Ye,X(r,s),K(r),He(r,s),Ne(r),ce(r,s),Ue(r,s),We(r,s),Be(r),ze(r,s),qe(r,s),G(r),pe(r),he(r),V(r,s),J(r,s),de(r,s);break;case"firefox":if(!rt||!le||!e.shimFirefox)return t("Firefox shim is not included in this adapter release."),n;t("adapter.js shimming firefox."),n.browserShim=rt,X(r,s),K(r),Ge(r,s),le(r,s),Je(r,s),Ve(r),Qe(r),Xe(r),Ke(r),Ze(r),et(r),tt(r),st(r),nt(r),G(r),he(r),V(r,s),J(r,s);break;case"safari":if(!ft||!e.shimSafari)return t("Safari shim is not included in this adapter release."),n;t("adapter.js shimming safari."),n.browserShim=ft,X(r,s),K(r),pt(r),dt(r),at(r),it(r),ot(r),ht(r),ct(r),ut(r),G(r),pe(r),V(r,s),J(r,s),de(r,s);break;default:t("Unsupported browser!");break}return n}const bt=Qt({window:typeof window>"u"?void 0:window});function w(r,e,t,s){Object.defineProperty(r,e,{get:t,set:s,enumerable:!0,configurable:!0})}class yt{constructor(){this.chunkedMTU=16300,this._dataCount=1,this.chunk=e=>{const t=[],s=e.byteLength,n=Math.ceil(s/this.chunkedMTU);let i=0,o=0;for(;o<s;){const a=Math.min(s,o+this.chunkedMTU),c=e.slice(o,a),l={__peerData:this._dataCount,n:i,data:c,total:n};t.push(l),o=a,i++}return this._dataCount++,t}}}function Zt(r){let e=0;for(const n of r)e+=n.byteLength;const t=new Uint8Array(e);let s=0;for(const n of r)t.set(n,s),s+=n.byteLength;return t}const ue=bt.default||bt,B=new class{isWebRTCSupported(){return typeof RTCPeerConnection<"u"}isBrowserSupported(){const r=this.getBrowser(),e=this.getVersion();return this.supportedBrowsers.includes(r)?r==="chrome"?e>=this.minChromeVersion:r==="firefox"?e>=this.minFirefoxVersion:r==="safari"?!this.isIOS&&e>=this.minSafariVersion:!1:!1}getBrowser(){return ue.browserDetails.browser}getVersion(){return ue.browserDetails.version||0}isUnifiedPlanSupported(){const r=this.getBrowser(),e=ue.browserDetails.version||0;if(r==="chrome"&&e<this.minChromeVersion)return!1;if(r==="firefox"&&e>=this.minFirefoxVersion)return!0;if(!window.RTCRtpTransceiver||!("currentDirection"in RTCRtpTransceiver.prototype))return!1;let t,s=!1;try{t=new RTCPeerConnection,t.addTransceiver("audio"),s=!0}catch{}finally{t&&t.close()}return s}toString(){return`Supports:
    browser:${this.getBrowser()}
    version:${this.getVersion()}
    isIOS:${this.isIOS}
    isWebRTCSupported:${this.isWebRTCSupported()}
    isBrowserSupported:${this.isBrowserSupported()}
    isUnifiedPlanSupported:${this.isUnifiedPlanSupported()}`}constructor(){this.isIOS=typeof navigator<"u"?["iPad","iPhone","iPod"].includes(navigator.platform):!1,this.supportedBrowsers=["firefox","chrome","safari"],this.minFirefoxVersion=59,this.minChromeVersion=72,this.minSafariVersion=605}},es=r=>!r||/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(r),_t=()=>Math.random().toString(36).slice(2),vt={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:["turn:eu-0.turn.peerjs.com:3478","turn:us-0.turn.peerjs.com:3478"],username:"peerjs",credential:"peerjsp"}],sdpSemantics:"unified-plan"};class ts extends yt{noop(){}blobToArrayBuffer(e,t){const s=new FileReader;return s.onload=function(n){n.target&&t(n.target.result)},s.readAsArrayBuffer(e),s}binaryStringToArrayBuffer(e){const t=new Uint8Array(e.length);for(let s=0;s<e.length;s++)t[s]=e.charCodeAt(s)&255;return t.buffer}isSecure(){return location.protocol==="https:"}constructor(...e){super(...e),this.CLOUD_HOST="0.peerjs.com",this.CLOUD_PORT=443,this.chunkedBrowsers={Chrome:1,chrome:1},this.defaultConfig=vt,this.browser=B.getBrowser(),this.browserVersion=B.getVersion(),this.pack=Le,this.unpack=Ie,this.supports=function(){const t={browser:B.isBrowserSupported(),webRTC:B.isWebRTCSupported(),audioVideo:!1,data:!1,binaryBlob:!1,reliable:!1};if(!t.webRTC)return t;let s;try{s=new RTCPeerConnection(vt),t.audioVideo=!0;let n;try{n=s.createDataChannel("_PEERJSTEST",{ordered:!0}),t.data=!0,t.reliable=!!n.ordered;try{n.binaryType="blob",t.binaryBlob=!B.isIOS}catch{}}catch{}finally{n&&n.close()}}catch{}finally{s&&s.close()}return t}(),this.validateId=es,this.randomToken=_t}}const E=new ts,ss="PeerJS: ";class ns{get logLevel(){return this._logLevel}set logLevel(e){this._logLevel=e}log(...e){this._logLevel>=3&&this._print(3,...e)}warn(...e){this._logLevel>=2&&this._print(2,...e)}error(...e){this._logLevel>=1&&this._print(1,...e)}setLogFunction(e){this._print=e}_print(e,...t){const s=[ss,...t];for(const n in s)s[n]instanceof Error&&(s[n]="("+s[n].name+") "+s[n].message);e>=3?console.log(...s):e>=2?console.warn("WARNING",...s):e>=1&&console.error("ERROR",...s)}constructor(){this._logLevel=0}}var f=new ns,fe={},rs=Object.prototype.hasOwnProperty,P="~";function z(){}Object.create&&(z.prototype=Object.create(null),new z().__proto__||(P=!1));function is(r,e,t){this.fn=r,this.context=e,this.once=t||!1}function xt(r,e,t,s,n){if(typeof t!="function")throw new TypeError("The listener must be a function");var i=new is(t,s||r,n),o=P?P+e:e;return r._events[o]?r._events[o].fn?r._events[o]=[r._events[o],i]:r._events[o].push(i):(r._events[o]=i,r._eventsCount++),r}function Q(r,e){--r._eventsCount===0?r._events=new z:delete r._events[e]}function T(){this._events=new z,this._eventsCount=0}T.prototype.eventNames=function(){var e=[],t,s;if(this._eventsCount===0)return e;for(s in t=this._events)rs.call(t,s)&&e.push(P?s.slice(1):s);return Object.getOwnPropertySymbols?e.concat(Object.getOwnPropertySymbols(t)):e},T.prototype.listeners=function(e){var t=P?P+e:e,s=this._events[t];if(!s)return[];if(s.fn)return[s.fn];for(var n=0,i=s.length,o=new Array(i);n<i;n++)o[n]=s[n].fn;return o},T.prototype.listenerCount=function(e){var t=P?P+e:e,s=this._events[t];return s?s.fn?1:s.length:0},T.prototype.emit=function(e,t,s,n,i,o){var a=P?P+e:e;if(!this._events[a])return!1;var c=this._events[a],l=arguments.length,p,h;if(c.fn){switch(c.once&&this.removeListener(e,c.fn,void 0,!0),l){case 1:return c.fn.call(c.context),!0;case 2:return c.fn.call(c.context,t),!0;case 3:return c.fn.call(c.context,t,s),!0;case 4:return c.fn.call(c.context,t,s,n),!0;case 5:return c.fn.call(c.context,t,s,n,i),!0;case 6:return c.fn.call(c.context,t,s,n,i,o),!0}for(h=1,p=new Array(l-1);h<l;h++)p[h-1]=arguments[h];c.fn.apply(c.context,p)}else{var d=c.length,g;for(h=0;h<d;h++)switch(c[h].once&&this.removeListener(e,c[h].fn,void 0,!0),l){case 1:c[h].fn.call(c[h].context);break;case 2:c[h].fn.call(c[h].context,t);break;case 3:c[h].fn.call(c[h].context,t,s);break;case 4:c[h].fn.call(c[h].context,t,s,n);break;default:if(!p)for(g=1,p=new Array(l-1);g<l;g++)p[g-1]=arguments[g];c[h].fn.apply(c[h].context,p)}}return!0},T.prototype.on=function(e,t,s){return xt(this,e,t,s,!1)},T.prototype.once=function(e,t,s){return xt(this,e,t,s,!0)},T.prototype.removeListener=function(e,t,s,n){var i=P?P+e:e;if(!this._events[i])return this;if(!t)return Q(this,i),this;var o=this._events[i];if(o.fn)o.fn===t&&(!n||o.once)&&(!s||o.context===s)&&Q(this,i);else{for(var a=0,c=[],l=o.length;a<l;a++)(o[a].fn!==t||n&&!o[a].once||s&&o[a].context!==s)&&c.push(o[a]);c.length?this._events[i]=c.length===1?c[0]:c:Q(this,i)}return this},T.prototype.removeAllListeners=function(e){var t;return e?(t=P?P+e:e,this._events[t]&&Q(this,t)):(this._events=new z,this._eventsCount=0),this},T.prototype.off=T.prototype.removeListener,T.prototype.addListener=T.prototype.on,T.prefixed=P,T.EventEmitter=T,fe=T;var O={};w(O,"ConnectionType",()=>L),w(O,"PeerErrorType",()=>x),w(O,"BaseConnectionErrorType",()=>me),w(O,"DataConnectionErrorType",()=>ge),w(O,"SerializationType",()=>Z),w(O,"SocketEventType",()=>M),w(O,"ServerMessageType",()=>j);var L=function(r){return r.Data="data",r.Media="media",r}({}),x=function(r){return r.BrowserIncompatible="browser-incompatible",r.Disconnected="disconnected",r.InvalidID="invalid-id",r.InvalidKey="invalid-key",r.Network="network",r.PeerUnavailable="peer-unavailable",r.SslUnavailable="ssl-unavailable",r.ServerError="server-error",r.SocketError="socket-error",r.SocketClosed="socket-closed",r.UnavailableID="unavailable-id",r.WebRTC="webrtc",r}({}),me=function(r){return r.NegotiationFailed="negotiation-failed",r.ConnectionClosed="connection-closed",r}({}),ge=function(r){return r.NotOpenYet="not-open-yet",r.MessageToBig="message-too-big",r}({}),Z=function(r){return r.Binary="binary",r.BinaryUTF8="binary-utf8",r.JSON="json",r.None="raw",r}({}),M=function(r){return r.Message="message",r.Disconnected="disconnected",r.Error="error",r.Close="close",r}({}),j=function(r){return r.Heartbeat="HEARTBEAT",r.Candidate="CANDIDATE",r.Offer="OFFER",r.Answer="ANSWER",r.Open="OPEN",r.Error="ERROR",r.IdTaken="ID-TAKEN",r.InvalidKey="INVALID-KEY",r.Leave="LEAVE",r.Expire="EXPIRE",r}({});const Ct="1.5.5";class os extends fe.EventEmitter{constructor(e,t,s,n,i,o=5e3){super(),this.pingInterval=o,this._disconnected=!0,this._messagesQueue=[];const a=e?"wss://":"ws://";this._baseUrl=a+t+":"+s+n+"peerjs?key="+i}start(e,t){this._id=e;const s=`${this._baseUrl}&id=${e}&token=${t}`;this._socket||!this._disconnected||(this._socket=new WebSocket(s+"&version="+Ct),this._disconnected=!1,this._socket.onmessage=n=>{let i;try{i=JSON.parse(n.data),f.log("Server message received:",i)}catch{f.log("Invalid server message",n.data);return}this.emit(M.Message,i)},this._socket.onclose=n=>{this._disconnected||(f.log("Socket closed.",n),this._cleanup(),this._disconnected=!0,this.emit(M.Disconnected))},this._socket.onopen=()=>{this._disconnected||(this._sendQueuedMessages(),f.log("Socket open"),this._scheduleHeartbeat())})}_scheduleHeartbeat(){this._wsPingTimer=setTimeout(()=>{this._sendHeartbeat()},this.pingInterval)}_sendHeartbeat(){if(!this._wsOpen()){f.log("Cannot send heartbeat, because socket closed");return}const e=JSON.stringify({type:j.Heartbeat});this._socket.send(e),this._scheduleHeartbeat()}_wsOpen(){return!!this._socket&&this._socket.readyState===1}_sendQueuedMessages(){const e=[...this._messagesQueue];this._messagesQueue=[];for(const t of e)this.send(t)}send(e){if(this._disconnected)return;if(!this._id){this._messagesQueue.push(e);return}if(!e.type){this.emit(M.Error,"Invalid message");return}if(!this._wsOpen())return;const t=JSON.stringify(e);this._socket.send(t)}close(){this._disconnected||(this._cleanup(),this._disconnected=!0)}_cleanup(){this._socket&&(this._socket.onopen=this._socket.onmessage=this._socket.onclose=null,this._socket.close(),this._socket=void 0),clearTimeout(this._wsPingTimer)}}class kt{constructor(e){this.connection=e}startConnection(e){const t=this._startPeerConnection();if(this.connection.peerConnection=t,this.connection.type===L.Media&&e._stream&&this._addTracksToConnection(e._stream,t),e.originator){const s=this.connection,n={ordered:!!e.reliable},i=t.createDataChannel(s.label,n);s._initializeDataChannel(i),this._makeOffer()}else this.handleSDP("OFFER",e.sdp)}_startPeerConnection(){f.log("Creating RTCPeerConnection.");const e=new RTCPeerConnection(this.connection.provider.options.config);return this._setupListeners(e),e}_setupListeners(e){const t=this.connection.peer,s=this.connection.connectionId,n=this.connection.type,i=this.connection.provider;f.log("Listening for ICE candidates."),e.onicecandidate=o=>{!o.candidate||!o.candidate.candidate||(f.log(`Received ICE candidates for ${t}:`,o.candidate),i.socket.send({type:j.Candidate,payload:{candidate:o.candidate,type:n,connectionId:s},dst:t}))},e.oniceconnectionstatechange=()=>{switch(e.iceConnectionState){case"failed":f.log("iceConnectionState is failed, closing connections to "+t),this.connection.emitError(me.NegotiationFailed,"Negotiation of connection to "+t+" failed."),this.connection.close();break;case"closed":f.log("iceConnectionState is closed, closing connections to "+t),this.connection.emitError(me.ConnectionClosed,"Connection to "+t+" closed."),this.connection.close();break;case"disconnected":f.log("iceConnectionState changed to disconnected on the connection with "+t);break;case"completed":e.onicecandidate=()=>{};break}this.connection.emit("iceStateChanged",e.iceConnectionState)},f.log("Listening for data channel"),e.ondatachannel=o=>{f.log("Received data channel");const a=o.channel;i.getConnection(t,s)._initializeDataChannel(a)},f.log("Listening for remote stream"),e.ontrack=o=>{f.log("Received remote stream");const a=o.streams[0],c=i.getConnection(t,s);if(c.type===L.Media){const l=c;this._addStreamToMediaConnection(a,l)}}}cleanup(){f.log("Cleaning up PeerConnection to "+this.connection.peer);const e=this.connection.peerConnection;if(!e)return;this.connection.peerConnection=null,e.onicecandidate=e.oniceconnectionstatechange=e.ondatachannel=e.ontrack=()=>{};const t=e.signalingState!=="closed";let s=!1;const n=this.connection.dataChannel;n&&(s=!!n.readyState&&n.readyState!=="closed"),(t||s)&&e.close()}async _makeOffer(){const e=this.connection.peerConnection,t=this.connection.provider;try{const s=await e.createOffer(this.connection.options.constraints);f.log("Created offer."),this.connection.options.sdpTransform&&typeof this.connection.options.sdpTransform=="function"&&(s.sdp=this.connection.options.sdpTransform(s.sdp)||s.sdp);try{await e.setLocalDescription(s),f.log("Set localDescription:",s,`for:${this.connection.peer}`);let n={sdp:s,type:this.connection.type,connectionId:this.connection.connectionId,metadata:this.connection.metadata};if(this.connection.type===L.Data){const i=this.connection;n={...n,label:i.label,reliable:i.reliable,serialization:i.serialization}}t.socket.send({type:j.Offer,payload:n,dst:this.connection.peer})}catch(n){n!="OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"&&(t.emitError(x.WebRTC,n),f.log("Failed to setLocalDescription, ",n))}}catch(s){t.emitError(x.WebRTC,s),f.log("Failed to createOffer, ",s)}}async _makeAnswer(){const e=this.connection.peerConnection,t=this.connection.provider;try{const s=await e.createAnswer();f.log("Created answer."),this.connection.options.sdpTransform&&typeof this.connection.options.sdpTransform=="function"&&(s.sdp=this.connection.options.sdpTransform(s.sdp)||s.sdp);try{await e.setLocalDescription(s),f.log("Set localDescription:",s,`for:${this.connection.peer}`),t.socket.send({type:j.Answer,payload:{sdp:s,type:this.connection.type,connectionId:this.connection.connectionId},dst:this.connection.peer})}catch(n){t.emitError(x.WebRTC,n),f.log("Failed to setLocalDescription, ",n)}}catch(s){t.emitError(x.WebRTC,s),f.log("Failed to create answer, ",s)}}async handleSDP(e,t){t=new RTCSessionDescription(t);const s=this.connection.peerConnection,n=this.connection.provider;f.log("Setting remote description",t);const i=this;try{await s.setRemoteDescription(t),f.log(`Set remoteDescription:${e} for:${this.connection.peer}`),e==="OFFER"&&await i._makeAnswer()}catch(o){n.emitError(x.WebRTC,o),f.log("Failed to setRemoteDescription, ",o)}}async handleCandidate(e){f.log("handleCandidate:",e);try{await this.connection.peerConnection.addIceCandidate(e),f.log(`Added ICE candidate for:${this.connection.peer}`)}catch(t){this.connection.provider.emitError(x.WebRTC,t),f.log("Failed to handleCandidate, ",t)}}_addTracksToConnection(e,t){if(f.log(`add tracks from stream ${e.id} to peer connection`),!t.addTrack)return f.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");e.getTracks().forEach(s=>{t.addTrack(s,e)})}_addStreamToMediaConnection(e,t){f.log(`add stream ${e.id} to media connection ${t.connectionId}`),t.addStream(e)}}class St extends fe.EventEmitter{emitError(e,t){f.error("Error:",t),this.emit("error",new as(`${e}`,t))}}class as extends Error{constructor(e,t){typeof t=="string"?super(t):(super(),Object.assign(this,t)),this.type=e}}class Tt extends St{get open(){return this._open}constructor(e,t,s){super(),this.peer=e,this.provider=t,this.options=s,this._open=!1,this.metadata=s.metadata}}const F=class F extends Tt{get type(){return L.Media}get localStream(){return this._localStream}get remoteStream(){return this._remoteStream}constructor(e,t,s){super(e,t,s),this._localStream=this.options._stream,this.connectionId=this.options.connectionId||F.ID_PREFIX+E.randomToken(),this._negotiator=new kt(this),this._localStream&&this._negotiator.startConnection({_stream:this._localStream,originator:!0})}_initializeDataChannel(e){this.dataChannel=e,this.dataChannel.onopen=()=>{f.log(`DC#${this.connectionId} dc connection success`),this.emit("willCloseOnRemote")},this.dataChannel.onclose=()=>{f.log(`DC#${this.connectionId} dc closed for:`,this.peer),this.close()}}addStream(e){f.log("Receiving stream",e),this._remoteStream=e,super.emit("stream",e)}handleMessage(e){const t=e.type,s=e.payload;switch(e.type){case j.Answer:this._negotiator.handleSDP(t,s.sdp),this._open=!0;break;case j.Candidate:this._negotiator.handleCandidate(s.candidate);break;default:f.warn(`Unrecognized message type:${t} from peer:${this.peer}`);break}}answer(e,t={}){if(this._localStream){f.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");return}this._localStream=e,t&&t.sdpTransform&&(this.options.sdpTransform=t.sdpTransform),this._negotiator.startConnection({...this.options._payload,_stream:e});const s=this.provider._getMessages(this.connectionId);for(const n of s)this.handleMessage(n);this._open=!0}close(){this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this._localStream=null,this._remoteStream=null,this.provider&&(this.provider._removeConnection(this),this.provider=null),this.options&&this.options._stream&&(this.options._stream=null),this.open&&(this._open=!1,super.emit("close"))}};Se=new WeakMap,Y(F,Se,F.ID_PREFIX="mc_");let ee=F;class cs{constructor(e){this._options=e}_buildRequest(e){const t=this._options.secure?"https":"http",{host:s,port:n,path:i,key:o}=this._options,a=new URL(`${t}://${s}:${n}${i}${o}/${e}`);return a.searchParams.set("ts",`${Date.now()}${Math.random()}`),a.searchParams.set("version",Ct),fetch(a.href,{referrerPolicy:this._options.referrerPolicy})}async retrieveId(){try{const e=await this._buildRequest("id");if(e.status!==200)throw new Error(`Error. Status:${e.status}`);return e.text()}catch(e){f.error("Error retrieving ID",e);let t="";throw this._options.path==="/"&&this._options.host!==E.CLOUD_HOST&&(t=" If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer."),new Error("Could not get an ID from the server."+t)}}async listAllPeers(){try{const e=await this._buildRequest("peers");if(e.status!==200){if(e.status===401){let t="";throw this._options.host===E.CLOUD_HOST?t="It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.":t="You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.",new Error("It doesn't look like you have permission to list peers IDs. "+t)}throw new Error(`Error. Status:${e.status}`)}return e.json()}catch(e){throw f.error("Error retrieving list peers",e),new Error("Could not get list peers from the server."+e)}}}const $=class $ extends Tt{get type(){return L.Data}constructor(e,t,s){super(e,t,s),this.connectionId=this.options.connectionId||$.ID_PREFIX+_t(),this.label=this.options.label||this.connectionId,this.reliable=!!this.options.reliable,this._negotiator=new kt(this),this._negotiator.startConnection(this.options._payload||{originator:!0,reliable:this.reliable})}_initializeDataChannel(e){this.dataChannel=e,this.dataChannel.onopen=()=>{f.log(`DC#${this.connectionId} dc connection success`),this._open=!0,this.emit("open")},this.dataChannel.onmessage=t=>{f.log(`DC#${this.connectionId} dc onmessage:`,t.data)},this.dataChannel.onclose=()=>{f.log(`DC#${this.connectionId} dc closed for:`,this.peer),this.close()}}close(e){if(e!=null&&e.flush){this.send({__peerData:{type:"close"}});return}this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this.provider&&(this.provider._removeConnection(this),this.provider=null),this.dataChannel&&(this.dataChannel.onopen=null,this.dataChannel.onmessage=null,this.dataChannel.onclose=null,this.dataChannel=null),this.open&&(this._open=!1,super.emit("close"))}send(e,t=!1){if(!this.open){this.emitError(ge.NotOpenYet,"Connection is not open. You should listen for the `open` event before sending messages.");return}return this._send(e,t)}async handleMessage(e){const t=e.payload;switch(e.type){case j.Answer:await this._negotiator.handleSDP(e.type,t.sdp);break;case j.Candidate:await this._negotiator.handleCandidate(t.candidate);break;default:f.warn("Unrecognized message type:",e.type,"from peer:",this.peer);break}}};Te=new WeakMap,je=new WeakMap,Y($,Te,$.ID_PREFIX="dc_"),Y($,je,$.MAX_BUFFERED_AMOUNT=8388608);let te=$;class be extends te{get bufferSize(){return this._bufferSize}_initializeDataChannel(e){super._initializeDataChannel(e),this.dataChannel.binaryType="arraybuffer",this.dataChannel.addEventListener("message",t=>this._handleDataMessage(t))}_bufferedSend(e){(this._buffering||!this._trySend(e))&&(this._buffer.push(e),this._bufferSize=this._buffer.length)}_trySend(e){if(!this.open)return!1;if(this.dataChannel.bufferedAmount>te.MAX_BUFFERED_AMOUNT)return this._buffering=!0,setTimeout(()=>{this._buffering=!1,this._tryBuffer()},50),!1;try{this.dataChannel.send(e)}catch(t){return f.error(`DC#:${this.connectionId} Error when sending:`,t),this._buffering=!0,this.close(),!1}return!0}_tryBuffer(){if(!this.open||this._buffer.length===0)return;const e=this._buffer[0];this._trySend(e)&&(this._buffer.shift(),this._bufferSize=this._buffer.length,this._tryBuffer())}close(e){if(e!=null&&e.flush){this.send({__peerData:{type:"close"}});return}this._buffer=[],this._bufferSize=0,super.close()}constructor(...e){super(...e),this._buffer=[],this._bufferSize=0,this._buffering=!1}}class ye extends be{close(e){super.close(e),this._chunkedData={}}constructor(e,t,s){super(e,t,s),this.chunker=new yt,this.serialization=Z.Binary,this._chunkedData={}}_handleDataMessage({data:e}){const t=Ie(e),s=t.__peerData;if(s){if(s.type==="close"){this.close();return}this._handleChunk(t);return}this.emit("data",t)}_handleChunk(e){const t=e.__peerData,s=this._chunkedData[t]||{data:[],count:0,total:e.total};if(s.data[e.n]=new Uint8Array(e.data),s.count++,this._chunkedData[t]=s,s.total===s.count){delete this._chunkedData[t];const n=Zt(s.data);this._handleDataMessage({data:n})}}_send(e,t){const s=Le(e);if(s instanceof Promise)return this._send_blob(s);if(!t&&s.byteLength>this.chunker.chunkedMTU){this._sendChunks(s);return}this._bufferedSend(s)}async _send_blob(e){const t=await e;if(t.byteLength>this.chunker.chunkedMTU){this._sendChunks(t);return}this._bufferedSend(t)}_sendChunks(e){const t=this.chunker.chunk(e);f.log(`DC#${this.connectionId} Try to send ${t.length} chunks...`);for(const s of t)this.send(s,!0)}}class ls extends be{_handleDataMessage({data:e}){super.emit("data",e)}_send(e,t){this._bufferedSend(e)}constructor(...e){super(...e),this.serialization=Z.None}}class ps extends be{_handleDataMessage({data:e}){const t=this.parse(this.decoder.decode(e)),s=t.__peerData;if(s&&s.type==="close"){this.close();return}this.emit("data",t)}_send(e,t){const s=this.encoder.encode(this.stringify(e));if(s.byteLength>=E.chunkedMTU){this.emitError(ge.MessageToBig,"Message too big for JSON channel");return}this._bufferedSend(s)}constructor(...e){super(...e),this.serialization=Z.JSON,this.encoder=new TextEncoder,this.decoder=new TextDecoder,this.stringify=JSON.stringify,this.parse=JSON.parse}}const W=class W extends St{get id(){return this._id}get options(){return this._options}get open(){return this._open}get socket(){return this._socket}get connections(){const e=Object.create(null);for(const[t,s]of this._connections)e[t]=s;return e}get destroyed(){return this._destroyed}get disconnected(){return this._disconnected}constructor(e,t){super(),this._serializers={raw:ls,json:ps,binary:ye,"binary-utf8":ye,default:ye},this._id=null,this._lastServerId=null,this._destroyed=!1,this._disconnected=!1,this._open=!1,this._connections=new Map,this._lostMessages=new Map;let s;if(e&&e.constructor==Object?t=e:e&&(s=e.toString()),t={debug:0,host:E.CLOUD_HOST,port:E.CLOUD_PORT,path:"/",key:W.DEFAULT_KEY,token:E.randomToken(),config:E.defaultConfig,referrerPolicy:"strict-origin-when-cross-origin",serializers:{},...t},this._options=t,this._serializers={...this._serializers,...this.options.serializers},this._options.host==="/"&&(this._options.host=window.location.hostname),this._options.path&&(this._options.path[0]!=="/"&&(this._options.path="/"+this._options.path),this._options.path[this._options.path.length-1]!=="/"&&(this._options.path+="/")),this._options.secure===void 0&&this._options.host!==E.CLOUD_HOST?this._options.secure=E.isSecure():this._options.host==E.CLOUD_HOST&&(this._options.secure=!0),this._options.logFunction&&f.setLogFunction(this._options.logFunction),f.logLevel=this._options.debug||0,this._api=new cs(t),this._socket=this._createServerConnection(),!E.supports.audioVideo&&!E.supports.data){this._delayedAbort(x.BrowserIncompatible,"The current browser does not support WebRTC");return}if(s&&!E.validateId(s)){this._delayedAbort(x.InvalidID,`ID "${s}" is invalid`);return}s?this._initialize(s):this._api.retrieveId().then(n=>this._initialize(n)).catch(n=>this._abort(x.ServerError,n))}_createServerConnection(){const e=new os(this._options.secure,this._options.host,this._options.port,this._options.path,this._options.key,this._options.pingInterval);return e.on(M.Message,t=>{this._handleMessage(t)}),e.on(M.Error,t=>{this._abort(x.SocketError,t)}),e.on(M.Disconnected,()=>{this.disconnected||(this.emitError(x.Network,"Lost connection to server."),this.disconnect())}),e.on(M.Close,()=>{this.disconnected||this._abort(x.SocketClosed,"Underlying socket is already closed.")}),e}_initialize(e){this._id=e,this.socket.start(e,this._options.token)}_handleMessage(e){const t=e.type,s=e.payload,n=e.src;switch(t){case j.Open:this._lastServerId=this.id,this._open=!0,this.emit("open",this.id);break;case j.Error:this._abort(x.ServerError,s.msg);break;case j.IdTaken:this._abort(x.UnavailableID,`ID "${this.id}" is taken`);break;case j.InvalidKey:this._abort(x.InvalidKey,`API KEY "${this._options.key}" is invalid`);break;case j.Leave:f.log(`Received leave message from ${n}`),this._cleanupPeer(n),this._connections.delete(n);break;case j.Expire:this.emitError(x.PeerUnavailable,`Could not connect to peer ${n}`);break;case j.Offer:{const i=s.connectionId;let o=this.getConnection(n,i);if(o&&(o.close(),f.warn(`Offer received for existing Connection ID:${i}`)),s.type===L.Media){const c=new ee(n,this,{connectionId:i,_payload:s,metadata:s.metadata});o=c,this._addConnection(n,o),this.emit("call",c)}else if(s.type===L.Data){const c=new this._serializers[s.serialization](n,this,{connectionId:i,_payload:s,metadata:s.metadata,label:s.label,serialization:s.serialization,reliable:s.reliable});o=c,this._addConnection(n,o),this.emit("connection",c)}else{f.warn(`Received malformed connection type:${s.type}`);return}const a=this._getMessages(i);for(const c of a)o.handleMessage(c);break}default:{if(!s){f.warn(`You received a malformed message from ${n} of type ${t}`);return}const i=s.connectionId,o=this.getConnection(n,i);o&&o.peerConnection?o.handleMessage(e):i?this._storeMessage(i,e):f.warn("You received an unrecognized message:",e);break}}}_storeMessage(e,t){this._lostMessages.has(e)||this._lostMessages.set(e,[]),this._lostMessages.get(e).push(t)}_getMessages(e){const t=this._lostMessages.get(e);return t?(this._lostMessages.delete(e),t):[]}connect(e,t={}){if(t={serialization:"default",...t},this.disconnected){f.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available."),this.emitError(x.Disconnected,"Cannot connect to new Peer after disconnecting from server.");return}const s=new this._serializers[t.serialization](e,this,t);return this._addConnection(e,s),s}call(e,t,s={}){if(this.disconnected){f.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect."),this.emitError(x.Disconnected,"Cannot connect to new Peer after disconnecting from server.");return}if(!t){f.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");return}const n=new ee(e,this,{...s,_stream:t});return this._addConnection(e,n),n}_addConnection(e,t){f.log(`add connection ${t.type}:${t.connectionId} to peerId:${e}`),this._connections.has(e)||this._connections.set(e,[]),this._connections.get(e).push(t)}_removeConnection(e){const t=this._connections.get(e.peer);if(t){const s=t.indexOf(e);s!==-1&&t.splice(s,1)}this._lostMessages.delete(e.connectionId)}getConnection(e,t){const s=this._connections.get(e);if(!s)return null;for(const n of s)if(n.connectionId===t)return n;return null}_delayedAbort(e,t){setTimeout(()=>{this._abort(e,t)},0)}_abort(e,t){f.error("Aborting!"),this.emitError(e,t),this._lastServerId?this.disconnect():this.destroy()}destroy(){this.destroyed||(f.log(`Destroy peer with ID:${this.id}`),this.disconnect(),this._cleanup(),this._destroyed=!0,this.emit("close"))}_cleanup(){for(const e of this._connections.keys())this._cleanupPeer(e),this._connections.delete(e);this.socket.removeAllListeners()}_cleanupPeer(e){const t=this._connections.get(e);if(t)for(const s of t)s.close()}disconnect(){if(this.disconnected)return;const e=this.id;f.log(`Disconnect peer with ID:${e}`),this._disconnected=!0,this._open=!1,this.socket.close(),this._lastServerId=e,this._id=null,this.emit("disconnected",e)}reconnect(){if(this.disconnected&&!this.destroyed)f.log(`Attempting reconnection to server with ID ${this._lastServerId}`),this._disconnected=!1,this._initialize(this._lastServerId);else{if(this.destroyed)throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");if(!this.disconnected&&!this.open)f.error("In a hurry? We're still trying to make the initial connection!");else throw new Error(`Peer ${this.id} cannot reconnect because it is not disconnected from the server!`)}}listAllPeers(e=t=>{}){this._api.listAllPeers().then(t=>e(t)).catch(t=>this._abort(x.ServerError,t))}};Pe=new WeakMap,Y(W,Pe,W.DEFAULT_KEY="peerjs");let _e=W;var jt=_e;const m={JOIN:"join",LEAVE:"leave",USER_LIST:"user-list",USERNAME_UPDATE:"username-update",CHAT:"chat",PRIVATE_CHAT:"private-chat",JUMP_SLIDE:"jump-slide",FOLLOW_MODE:"follow-mode",SLIDE_CHANGE:"slide-change",POLL_START:"poll-start",POLL_ANSWER:"poll-answer",POLL_RESULTS:"poll-results",PONG_INVITE:"pong-invite",PONG_ACCEPT:"pong-accept",PONG_DECLINE:"pong-decline",PONG_STATE:"pong-state",PONG_MOVE:"pong-move",PONG_SCORE:"pong-score",PONG_END:"pong-end",ARENA_START:"arena-start",ARENA_STATE:"arena-state",ARENA_INPUT:"arena-input",ARENA_SHOOT:"arena-shoot",ARENA_HIT:"arena-hit",ARENA_END:"arena-end"};function _(r,e){return{type:r,payload:e,timestamp:Date.now()}}function hs(r){let e=0;for(let t=0;t<r.length;t++){const s=r.charCodeAt(t);e=(e<<5)-e+s,e|=0}return Math.abs(e).toString(36)}function ds(){const r=window.location.href.split("#")[0];return`reveal-lobby-${hs(r)}`}class us{constructor(){this.peer=null,this.isHub=!1,this.lobbyId=ds(),this.myId=null,this.myUser=null,this.users=new Map,this.connections=new Map,this.chatMessages=[],this.followMode=!1,this.listeners=new Map,this._visitorCounter=0,this._destroyed=!1}on(e,t){this.listeners.has(e)||this.listeners.set(e,[]),this.listeners.get(e).push(t)}off(e,t){if(this.listeners.has(e)){const s=this.listeners.get(e).filter(n=>n!==t);this.listeners.set(e,s)}}_emit(e,t){if(this.listeners.has(e))for(const s of this.listeners.get(e))try{s(t)}catch(n){console.error("[RevealPeerJS] Listener error:",n)}}connect(e){return new Promise((t,s)=>{const n=e.username||"Visitor",i=e.color||"#4fc3f7",o=new jt(this.lobbyId,{debug:0,config:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]}});let a=!1;o.on("open",c=>{this.peer=o,this.isHub=!0,this.myId=c;const l=n.startsWith("Visitor")?"Visitor #1 (Hub)":n;this.myUser={id:c,username:l,color:i,isHub:!0,number:0},this.users.set(c,{...this.myUser,conn:null}),a=!0,this._emit("connected",{isHub:!0,user:this.myUser}),this._emit("user-list",this.getUserList()),t({isHub:!0})}),o.on("error",c=>{c.type==="unavailable-id"&&!a?(a=!0,o.destroy(),this._connectAsVisitor(n,i).then(t).catch(s)):a||(this._emit("error",c),s(c))}),setTimeout(()=>{a||(a=!0,o.destroy(),this._connectAsVisitor(n,i).then(t).catch(s))},5e3),o.on("connection",c=>{this._handleHubConnection(c)})})}_connectAsVisitor(e,t){return new Promise((s,n)=>{const i=new jt(void 0,{debug:0,config:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]}});i.on("open",o=>{this.peer=i,this.isHub=!1,this.myId=o;const a=i.connect(this.lobbyId,{reliable:!0});a.on("open",()=>{this.connections.set(this.lobbyId,a),a.send(_(m.JOIN,{id:o,username:e,color:t,isHub:!1})),this.myUser={id:o,username:e,color:t,isHub:!1,number:-1},this._emit("connected",{isHub:!1,user:this.myUser}),s({isHub:!1})}),a.on("data",c=>{this._handleIncomingMessage(c,a,this.lobbyId)}),a.on("close",()=>{this._emit("disconnected",{peerId:this.lobbyId})}),a.on("error",c=>{this._emit("error",c)})}),i.on("error",o=>{this._emit("error",o),n(o)}),i.on("connection",o=>{this._handleDirectConnection(o)})})}_handleHubConnection(e){e.on("open",()=>{this.connections.set(e.peer,e),this._emit("peer-connected",{peerId:e.peer})}),e.on("data",t=>{this._handleHubMessage(t,e)}),e.on("close",()=>{const t=this.users.get(e.peer);t&&(this.users.delete(e.peer),this.connections.delete(e.peer),this._broadcastFromHub(_(m.LEAVE,{id:e.peer,username:t.username})),this._emit("user-list",this.getUserList()),this._emit("peer-disconnected",{peerId:e.peer,username:t.username}))}),e.on("error",t=>{console.error("[RevealPeerJS] Hub connection error:",t)})}_handleDirectConnection(e){e.on("open",()=>{this.connections.set(e.peer,e)}),e.on("data",t=>{this._handleIncomingMessage(t,e,e.peer)}),e.on("close",()=>{this.connections.delete(e.peer)})}_handleHubMessage(e,t){if(!e||!e.type)return;const s=e;switch(s.type){case m.JOIN:{this._visitorCounter++;const n=s.payload.username&&!s.payload.username.startsWith("Visitor")?s.payload.username:`Visitor #${this._visitorCounter}`,i={id:s.payload.id,username:n,color:s.payload.color||"#4fc3f7",isHub:!1,number:this._visitorCounter,conn:t};this.users.set(s.payload.id,i),t.send(_(m.USER_LIST,{yourNumber:this._visitorCounter,yourAssignedName:i.username,users:this.getUserList(),chatHistory:this.chatMessages.slice(-50)})),this._broadcastFromHub(_(m.USER_LIST,{users:this.getUserList()}),s.payload.id),this._emit("user-list",this.getUserList()),this._emit("peer-connected",{peerId:s.payload.id,username:i.username});break}case m.CHAT:{const n={from:s.payload.from||t.peer,username:s.payload.username,color:s.payload.color,text:s.payload.text,timestamp:s.timestamp,private:!1};this.chatMessages.push(n),this._broadcastFromHub(_(m.CHAT,n)),this._emit("chat",n);break}case m.PRIVATE_CHAT:{const n={from:s.payload.from||t.peer,to:s.payload.to,username:s.payload.username,color:s.payload.color,text:s.payload.text,timestamp:s.timestamp,private:!0};this._sendToPeer(s.payload.to,_(m.PRIVATE_CHAT,n)),this._emit("chat",n);break}case m.SLIDE_CHANGE:{this.followMode&&s.payload.from===this._followTarget&&this._broadcastFromHub(_(m.JUMP_SLIDE,{indexh:s.payload.indexh,indexv:s.payload.indexv}),t.peer);break}case m.POLL_ANSWER:{this._emit("poll-answer",s.payload);break}case m.PONG_MOVE:case m.PONG_ACCEPT:case m.PONG_DECLINE:{s.payload&&s.payload.to&&this._sendToPeer(s.payload.to,s),this._emit(s.type,s.payload);break}case m.ARENA_INPUT:case m.ARENA_SHOOT:{this._emit(s.type,{...s.payload,from:t.peer}),this._broadcastFromHub(_(s.type,{...s.payload,from:t.peer}),t.peer);break}case m.USERNAME_UPDATE:{const n=this.users.get(s.payload.id);n&&(n.username=s.payload.username,n.color=s.payload.color,this.users.set(s.payload.id,n),this._broadcastFromHub(_(m.USER_LIST,{users:this.getUserList()})),this._emit("user-list",this.getUserList()));break}default:this._emit("raw-message",s)}}_handleIncomingMessage(e,t,s){if(!e||!e.type)return;const n=e;switch(n.type){case m.USER_LIST:{if(n.payload.yourNumber!==void 0&&(this.myUser.number=n.payload.yourNumber,(!this.myUser.username||this.myUser.username.startsWith("slide-visitor"))&&(this.myUser.username=n.payload.yourAssignedName||`slide-visitor#${n.payload.yourNumber}`),this._emit("assigned-name",this.myUser.username)),n.payload.users){for(const o of n.payload.users)o.id!==this.myId&&this.users.set(o.id,{...o,conn:null});const i=new Set(n.payload.users.map(o=>o.id));i.add(this.myId);for(const[o]of this.users)i.has(o)||this.users.delete(o)}n.payload.chatHistory&&(this.chatMessages=n.payload.chatHistory,this._emit("chat-history",n.payload.chatHistory)),this._emit("user-list",this.getUserList());break}case m.LEAVE:{this.users.delete(n.payload.id),this._emit("user-list",this.getUserList()),this._emit("peer-disconnected",n.payload);break}case m.CHAT:{this.chatMessages.push(n.payload),this._emit("chat",n.payload);break}case m.PRIVATE_CHAT:{this.chatMessages.push(n.payload),this._emit("chat",n.payload);break}case m.JUMP_SLIDE:{this._emit("jump-slide",n.payload);break}case m.FOLLOW_MODE:{this.followMode=n.payload.active,this._followTarget=n.payload.target,this._emit("follow-mode",n.payload);break}case m.POLL_START:{this._emit("poll-start",n.payload);break}case m.POLL_RESULTS:{this._emit("poll-results",n.payload);break}case m.PONG_INVITE:case m.PONG_MOVE:case m.PONG_ACCEPT:case m.PONG_DECLINE:case m.PONG_STATE:case m.PONG_SCORE:case m.PONG_END:{this._emit(n.type,n.payload);break}case m.ARENA_START:case m.ARENA_STATE:case m.ARENA_INPUT:case m.ARENA_SHOOT:case m.ARENA_HIT:case m.ARENA_END:{this._emit(n.type,n.payload);break}default:this._emit("raw-message",n)}}_broadcastFromHub(e,t=null){for(const[s,n]of this.connections)if(s!==t&&n&&n.open)try{n.send(e)}catch(i){console.warn("[RevealPeerJS] Failed to send to",s,i)}}_sendToPeer(e,t){const s=this.connections.get(e);if(s&&s.open)try{s.send(t)}catch(n){console.warn("[RevealPeerJS] Failed to send to",e,n)}}sendChat(e,t=null){const s={from:this.myId,username:this.myUser.username,color:this.myUser.color,text:e};if(this.isHub)if(t){const n={...s,to:t,private:!0};this.chatMessages.push(n),this._sendToPeer(t,_(m.PRIVATE_CHAT,n)),this._emit("chat",n)}else{const n={...s,private:!1};this.chatMessages.push(n),this._broadcastFromHub(_(m.CHAT,n)),this._emit("chat",n)}else t?this._sendToPeer(this.lobbyId,_(m.PRIVATE_CHAT,{...s,to:t})):this._sendToPeer(this.lobbyId,_(m.CHAT,s))}jumpAllToSlide(e,t){this.isHub&&this._broadcastFromHub(_(m.JUMP_SLIDE,{indexh:e,indexv:t}))}setFollowMode(e,t=null){this.isHub&&(this.followMode=e,this._followTarget=t,this._broadcastFromHub(_(m.FOLLOW_MODE,{active:e,target:t})),this._emit("follow-mode",{active:e,target:t}))}startPoll(e){this.isHub&&(this._broadcastFromHub(_(m.POLL_START,e)),this._emit("poll-start",e))}answerPoll(e,t){const s=_(m.POLL_ANSWER,{pollId:e,answer:t,from:this.myId,username:this.myUser.username});this.isHub?this._emit("poll-answer",s.payload):this._sendToPeer(this.lobbyId,s)}sendPollResults(e){this.isHub&&(this._broadcastFromHub(_(m.POLL_RESULTS,e)),this._emit("poll-results",e))}reportSlideChange(e,t){this.isHub||this._sendToPeer(this.lobbyId,_(m.SLIDE_CHANGE,{from:this.myId,indexh:e,indexv:t}))}updateProfile(e,t){if(this.myUser.username=e,this.myUser.color=t,this.isHub){const s=this.users.get(this.myId);s&&(s.username=e,s.color=t),this._broadcastFromHub(_(m.USER_LIST,{users:this.getUserList()})),this._emit("user-list",this.getUserList())}else this._sendToPeer(this.lobbyId,_(m.USERNAME_UPDATE,{id:this.myId,username:e,color:t}))}sendPongInvite(e){const t=_(m.PONG_INVITE,{from:this.myId,fromUsername:this.myUser.username,to:e});this.isHub?this._sendToPeer(e,t):this._sendToPeer(this.lobbyId,t)}sendPongMove(e,t){const s=_(m.PONG_MOVE,{from:this.myId,to:e,y:t});this.isHub?this._sendToPeer(e,s):this._sendToPeer(this.lobbyId,s)}startArena(e){this.isHub&&(this._broadcastFromHub(_(m.ARENA_START,e)),this._emit("arena-start",e))}broadcastArenaState(e){this.isHub&&(this._broadcastFromHub(_(m.ARENA_STATE,e)),this._emit("arena-state",e))}sendArenaInput(e){const t=_(m.ARENA_INPUT,{from:this.myId,...e});this.isHub?this._emit("arena-input",{...e,from:this.myId}):this._sendToPeer(this.lobbyId,t)}sendArenaShoot(e){const t=_(m.ARENA_SHOOT,{from:this.myId,...e});this.isHub?this._emit("arena-shoot",{...e,from:this.myId}):this._sendToPeer(this.lobbyId,t)}broadcastArenaHit(e){this.isHub&&(this._broadcastFromHub(_(m.ARENA_HIT,e)),this._emit("arena-hit",e))}broadcastArenaEnd(e){this.isHub&&(this._broadcastFromHub(_(m.ARENA_END,e)),this._emit("arena-end",e))}getUserList(){const e=[];let t=!1;for(const[s,n]of this.users)s===this.myId&&(t=!0),e.push({id:n.id,username:n.username,color:n.color,isHub:n.isHub,number:n.number});return!t&&this.myUser&&e.push({id:this.myUser.id,username:this.myUser.username,color:this.myUser.color,isHub:this.myUser.isHub,number:this.myUser.number}),e.sort((s,n)=>s.isHub&&!n.isHub?-1:!s.isHub&&n.isHub?1:(s.number||0)-(n.number||0))}goOffline(){this.peer&&!this.peer.destroyed&&(this.isHub?this.myUser._offline=!0:this.peer.disconnect())}goOnline(){this.peer&&this.peer.disconnected&&this.peer.reconnect(),this.myUser._offline=!1}destroy(){if(this._destroyed=!0,this.peer){if(!this.isHub)try{this._sendToPeer(this.lobbyId,_(m.LEAVE,{id:this.myId,username:this.myUser.username}))}catch{}this.peer.destroy()}this.connections.clear(),this.users.clear(),this.listeners.clear()}}const Pt="reveal-peerjs-settings",Et={username:"",color:"#4fc3f7",darkMode:!1,highContrast:!1,goOffline:!1};function fs(){try{const r=localStorage.getItem(Pt);if(r)return{...Et,...JSON.parse(r)}}catch{}return{...Et}}function Rt(r){try{localStorage.setItem(Pt,JSON.stringify(r))}catch{}}const ve="reveal-peerjs-styles";function ms(){if(document.getElementById(ve))return;const r=document.createElement("style");r.id=ve,r.textContent=`
    /* ========== Toolbar ========== */
    .rpjs-toolbar {
      position: fixed !important;
      bottom: 12px !important;
      left: 12px !important;
      display: flex !important;
      gap: 4px;
      z-index: 10003 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: auto;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .rpjs-toolbar button {
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      border: none !important;
      border-radius: 6px;
      background: rgba(30, 30, 30, 0.75) !important;
      color: rgba(255, 255, 255, 0.8) !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 0 !important;
      outline: none;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .rpjs-toolbar button:hover {
      background: rgba(50, 50, 50, 0.9);
      color: #fff;
      transform: scale(1.08);
    }

    .rpjs-toolbar button.rpjs-active {
      background: rgba(79, 195, 247, 0.6);
      color: #fff;
    }

    .rpjs-toolbar button.rpjs-hub-btn {
      background: rgba(255, 167, 38, 0.7);
    }

    .rpjs-toolbar button.rpjs-hub-btn:hover {
      background: rgba(255, 167, 38, 0.9);
    }

    /* ========== Lobby Panel ========== */
    .rpjs-lobby-panel {
      position: fixed;
      bottom: 56px;
      left: 12px;
      width: 340px;
      min-width: 280px;
      max-width: 600px;
      height: 480px;
      min-height: 300px;
      max-height: 80vh;
      border-radius: 12px;
      background: rgba(20, 20, 25, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #e0e0e0;
      font-size: 13px;
      animation: rpjs-fade-up 0.2s ease;
      resize: both;
    }

    .rpjs-resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%);
      border-radius: 0 0 12px 0;
      pointer-events: auto;
    }

    .rpjs-resize-handle:hover {
      background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.4) 50%);
    }

    @keyframes rpjs-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .rpjs-lobby-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-weight: 600;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      cursor: grab;
      user-select: none;
    }

    .rpjs-lobby-header:active {
      cursor: grabbing;
    }

    .rpjs-lobby-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .rpjs-lobby-close:hover {
      color: #fff;
    }

    /* Users list */
    .rpjs-users-section {
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      max-height: 140px;
      overflow-y: auto;
    }

    .rpjs-users-section::-webkit-scrollbar {
      width: 4px;
    }

    .rpjs-users-section::-webkit-scrollbar-track {
      background: transparent;
    }

    .rpjs-users-section::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }

    .rpjs-user-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 14px;
      cursor: pointer;
      transition: background 0.15s;
      border-radius: 4px;
      margin: 0 4px;
    }

    .rpjs-user-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .rpjs-user-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .rpjs-user-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }

    .rpjs-user-hub-tag {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(255, 167, 38, 0.25);
      color: #ffa726;
      font-weight: 600;
    }

    .rpjs-user-self-tag {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(79, 195, 247, 0.2);
      color: #4fc3f7;
      font-weight: 500;
    }

    /* Chat area */
    .rpjs-chat-section {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .rpjs-chat-section::-webkit-scrollbar {
      width: 4px;
    }

    .rpjs-chat-section::-webkit-scrollbar-track {
      background: transparent;
    }

    .rpjs-chat-section::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }

    .rpjs-chat-msg {
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
      word-break: break-word;
    }

    .rpjs-chat-msg:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .rpjs-chat-msg-private {
      background: rgba(156, 39, 176, 0.1);
      border-left: 2px solid rgba(156, 39, 176, 0.4);
    }

    .rpjs-chat-username {
      font-weight: 600;
      margin-right: 6px;
    }

    .rpjs-chat-text {
      color: rgba(255, 255, 255, 0.8);
    }

    .rpjs-chat-private-label {
      font-size: 10px;
      color: rgba(156, 39, 176, 0.7);
      margin-right: 4px;
    }

    .rpjs-chat-system {
      color: rgba(255, 255, 255, 0.4);
      font-style: italic;
      font-size: 11px;
    }

    /* Chat input area */
    .rpjs-chat-input-area {
      display: flex;
      gap: 4px;
      padding: 8px 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      align-items: center;
    }

    .rpjs-chat-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 6px 10px;
      color: #e0e0e0;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }

    .rpjs-chat-input:focus {
      border-color: rgba(79, 195, 247, 0.5);
    }

    .rpjs-chat-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .rpjs-target-dropdown {
      position: relative;
      display: flex;
      align-items: center;
    }

    .rpjs-target-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #e0e0e0;
      padding: 5px 8px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      font-family: inherit;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rpjs-target-btn:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    .rpjs-target-btn.rpjs-private-active {
      border-color: rgba(156, 39, 176, 0.5);
      color: #ce93d8;
    }

    .rpjs-target-dropdown-list {
      position: absolute;
      bottom: 100%;
      left: 0;
      background: rgba(30, 30, 35, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      min-width: 160px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 10000;
      margin-bottom: 4px;
      display: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    .rpjs-target-dropdown-list.rpjs-open {
      display: block;
    }

    .rpjs-target-dropdown-item {
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .rpjs-target-dropdown-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .rpjs-send-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(79, 195, 247, 0.5);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .rpjs-send-btn:hover {
      background: rgba(79, 195, 247, 0.7);
    }

    /* ========== Settings Modal ========== */
    .rpjs-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: rpjs-fade-in 0.15s ease;
    }

    @keyframes rpjs-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .rpjs-modal {
      background: rgba(28, 28, 32, 0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 24px;
      width: 360px;
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      color: #e0e0e0;
      animation: rpjs-scale-in 0.2s ease;
    }

    @keyframes rpjs-scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .rpjs-modal-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
    }

    .rpjs-modal-close {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 2px;
      display: flex;
      transition: color 0.2s;
    }

    .rpjs-modal-close:hover {
      color: #fff;
    }

    .rpjs-field {
      margin-bottom: 16px;
    }

    .rpjs-field-label {
      display: block;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .rpjs-field-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      color: #e0e0e0;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      box-sizing: border-box;
    }

    .rpjs-field-input:focus {
      border-color: rgba(79, 195, 247, 0.5);
    }

    .rpjs-color-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rpjs-color-picker {
      width: 40px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      cursor: pointer;
      padding: 2px;
      background: transparent;
    }

    .rpjs-color-hex {
      flex: 1;
    }

    .rpjs-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .rpjs-toggle-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }

    .rpjs-toggle {
      position: relative;
      width: 40px;
      height: 22px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 11px;
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      outline: none;
    }

    .rpjs-toggle.rpjs-active {
      background: rgba(79, 195, 247, 0.6);
    }

    .rpjs-toggle::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .rpjs-toggle.rpjs-active::after {
      transform: translateX(18px);
    }

    .rpjs-save-btn {
      width: 100%;
      padding: 10px;
      background: rgba(79, 195, 247, 0.4);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 8px;
      font-family: inherit;
    }

    .rpjs-save-btn:hover {
      background: rgba(79, 195, 247, 0.6);
    }

    /* ========== Hub Menu ========== */
    .rpjs-hub-menu {
      position: fixed;
      bottom: 56px;
      left: 88px;
      width: 280px;
      border-radius: 12px;
      background: rgba(20, 20, 25, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 167, 38, 0.15);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 10px;
      color: #e0e0e0;
      animation: rpjs-fade-up 0.2s ease;
    }

    .rpjs-hub-menu-title {
      font-size: 12px;
      font-weight: 600;
      color: #ffa726;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 6px;
    }

    .rpjs-hub-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }

    .rpjs-hub-menu-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }

    .rpjs-hub-menu-item.rpjs-active-feature {
      background: rgba(255, 167, 38, 0.15);
      color: #ffa726;
    }

    .rpjs-hub-menu-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .rpjs-hub-menu-label {
      flex: 1;
    }

    .rpjs-hub-menu-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.5);
    }

    .rpjs-hub-menu-status.rpjs-on {
      background: rgba(76, 175, 80, 0.2);
      color: #66bb6a;
    }

    /* ========== Poll Modal ========== */
    .rpjs-poll-modal {
      width: 400px;
    }

    .rpjs-poll-question-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 12px;
      color: #e0e0e0;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .rpjs-poll-question-input:focus {
      border-color: rgba(255, 167, 38, 0.5);
    }

    .rpjs-poll-answers {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .rpjs-poll-answer-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .rpjs-poll-answer-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 7px 10px;
      color: #e0e0e0;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }

    .rpjs-poll-answer-input:focus {
      border-color: rgba(255, 167, 38, 0.4);
    }

    .rpjs-poll-remove-btn {
      background: rgba(244, 67, 54, 0.2);
      border: none;
      border-radius: 4px;
      color: #ef5350;
      cursor: pointer;
      padding: 5px 8px;
      font-size: 14px;
    }

    .rpjs-poll-remove-btn:hover {
      background: rgba(244, 67, 54, 0.35);
    }

    .rpjs-poll-add-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 6px;
      font-size: 12px;
      width: 100%;
      font-family: inherit;
      transition: all 0.2s;
    }

    .rpjs-poll-add-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
    }

    .rpjs-poll-publish-btn {
      width: 100%;
      padding: 10px;
      background: rgba(255, 167, 38, 0.5);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      font-family: inherit;
    }

    .rpjs-poll-publish-btn:hover {
      background: rgba(255, 167, 38, 0.7);
    }

    /* Poll vote overlay */
    .rpjs-poll-vote-overlay {
      position: fixed;
      inset: 0;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: rpjs-fade-in 0.15s ease;
    }

    .rpjs-poll-vote-card {
      background: rgba(28, 28, 32, 0.97);
      border: 1px solid rgba(255, 167, 38, 0.2);
      border-radius: 14px;
      padding: 24px;
      width: 380px;
      max-width: 90vw;
      color: #e0e0e0;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
      animation: rpjs-scale-in 0.2s ease;
    }

    .rpjs-poll-vote-question {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #fff;
    }

    .rpjs-poll-vote-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .rpjs-poll-vote-option {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      color: #e0e0e0;
      text-align: left;
      font-family: inherit;
    }

    .rpjs-poll-vote-option:hover {
      background: rgba(255, 167, 38, 0.15);
      border-color: rgba(255, 167, 38, 0.3);
    }

    .rpjs-poll-timer-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .rpjs-poll-timer-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffa726, #ff7043);
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    /* Poll results */
    .rpjs-poll-results-card {
      width: 380px;
    }

    .rpjs-poll-result-row {
      margin-bottom: 12px;
    }

    .rpjs-poll-result-label {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .rpjs-poll-result-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      overflow: hidden;
    }

    .rpjs-poll-result-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffa726, #ff7043);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* ========== Pong Overlay ========== */
    .rpjs-pong-overlay {
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: none;
      touch-action: none;
    }

    .rpjs-pong-canvas {
      width: 100%;
      height: 100%;
    }

    .rpjs-pong-hud {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 30px;
      align-items: center;
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .rpjs-pong-score {
      min-width: 30px;
      text-align: center;
    }

    .rpjs-pong-divider {
      color: rgba(255, 255, 255, 0.3);
      font-size: 20px;
    }

    .rpjs-pong-players {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }

    .rpjs-pong-exit {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.7);
      padding: 6px 12px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      z-index: 10002;
      cursor: pointer;
    }

    .rpjs-pong-exit:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* ========== Context Menu ========== */
    .rpjs-context-menu {
      position: fixed;
      z-index: 10001;
      background: rgba(28, 28, 32, 0.97);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 4px;
      min-width: 150px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: rpjs-fade-in 0.1s ease;
    }

    .rpjs-context-menu-item {
      padding: 7px 12px;
      cursor: pointer;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }

    .rpjs-context-menu-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    /* ========== High Contrast Mode ========== */
    .rpjs-high-contrast .rpjs-toolbar button {
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #fff;
      color: #fff;
    }

    .rpjs-high-contrast .rpjs-lobby-panel,
    .rpjs-high-contrast .rpjs-hub-menu,
    .rpjs-high-contrast .rpjs-modal {
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #fff;
    }

    .rpjs-high-contrast .rpjs-chat-input,
    .rpjs-high-contrast .rpjs-field-input,
    .rpjs-high-contrast .rpjs-poll-question-input,
    .rpjs-high-contrast .rpjs-poll-answer-input {
      border: 2px solid rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
    }

    .rpjs-high-contrast .rpjs-chat-msg {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* ========== Dark Mode (presentation override) ========== */
    .rpjs-dark-mode .reveal {
      color: #e0e0e0;
    }

    .rpjs-dark-mode .reveal .slides section {
      color: #e0e0e0;
    }

    .rpjs-dark-mode .reveal .slides section h1,
    .rpjs-dark-mode .reveal .slides section h2,
    .rpjs-dark-mode .reveal .slides section h3 {
      color: #fff;
    }

    /* Connection status indicator */
    .rpjs-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
      margin-left: 6px;
      animation: rpjs-pulse 2s ease infinite;
    }

    .rpjs-status-dot.rpjs-offline {
      background: #f44336;
      animation: none;
    }

    .rpjs-status-dot.rpjs-connecting {
      background: #ff9800;
    }

    @keyframes rpjs-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Notification badge */
    .rpjs-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #f44336;
      border-radius: 50%;
      font-size: 8px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      pointer-events: none;
    }

    /* ========== Arena Overlay ========== */
    .rpjs-arena-overlay {
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(10, 10, 18, 0.88);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: crosshair;
      touch-action: none;
    }

    .rpjs-arena-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .rpjs-arena-hud {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      align-items: center;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }

    .rpjs-arena-hud-title {
      font-size: 15px;
      color: #ffa726;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .rpjs-arena-exit {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.7);
      padding: 6px 12px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      z-index: 10002;
    }

    .rpjs-arena-exit:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .rpjs-arena-controls {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      pointer-events: none;
      text-align: center;
    }

    .rpjs-arena-scoreboard {
      position: absolute;
      top: 44px;
      right: 16px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      pointer-events: none;
      min-width: 140px;
    }

    .rpjs-arena-scoreboard-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }

    .rpjs-arena-scoreboard-name {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rpjs-arena-scoreboard-hp {
      font-weight: 600;
    }

    .rpjs-arena-scoreboard-hp.hit {
      color: #ff9800;
    }

    .rpjs-arena-scoreboard-hp.alive {
      color: #4caf50;
    }

    /* Arena touch controls (mobile) */
    .rpjs-arena-touch-controls {
      display: none;
    }

    @media (pointer: coarse), (hover: none) {
      .rpjs-arena-touch-controls {
        display: block;
      }
      .rpjs-arena-controls {
        display: none;
      }
    }

    .rpjs-arena-joystick {
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 130px;
      height: 130px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 2px solid rgba(255, 255, 255, 0.15);
      z-index: 10002;
    }

    .rpjs-arena-joystick-knob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      pointer-events: none;
      transition: none;
    }

    .rpjs-arena-shoot-btn {
      position: absolute;
      bottom: 30px;
      right: 30px;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(244, 67, 54, 0.25);
      border: 2px solid rgba(244, 67, 54, 0.5);
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      letter-spacing: 1px;
      z-index: 10002;
      cursor: pointer;
    }

    .rpjs-arena-shoot-btn:active {
      background: rgba(244, 67, 54, 0.5);
    }

    /* Pong touch controls */
    .rpjs-pong-exit {
      min-width: 44px;
      min-height: 44px;
    }
  `,document.head.appendChild(r)}function gs(){const r=document.getElementById(ve);r&&r.remove()}const It='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',bs='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',ys='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m-7.5-3.5l4.24-4.24m4.52-4.52L17.5 4.5M1 12h6m6 0h6m-3.5 7.5l-4.24-4.24M8.76 10.76 4.5 6.5"></path></svg>',_s='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',se='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',vs='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',xs='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',Cs='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>',ks='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><line x1="4" y1="4" x2="4" y2="20"></line><line x1="20" y1="4" x2="20" y2="20"></line></svg>',Lt='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',Ss='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',Ts='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>';class js{constructor(e,t){this.network=e,this.settings=t,this.el=null,this.chatTarget=null,this._dropdownOpen=!1,this._contextMenu=null,this._onContextMenu=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-lobby-panel",this.el.innerHTML=`
      <div class="rpjs-lobby-header">
        <span>Lobby</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="rpjs-status-dot" id="rpjs-status-dot"></span>
          <button class="rpjs-lobby-close" id="rpjs-lobby-close">${se}</button>
        </div>
      </div>
      <div class="rpjs-resize-handle" id="rpjs-resize-handle" title="Drag to resize"></div>
      <div class="rpjs-users-section" id="rpjs-users-list"></div>
      <div class="rpjs-chat-section" id="rpjs-chat-messages"></div>
      <div class="rpjs-chat-input-area">
        <div class="rpjs-target-dropdown">
          <button class="rpjs-target-btn ${this.chatTarget?"rpjs-private-active":""}" id="rpjs-target-btn">
            ${this.chatTarget?this._getTargetName():"Lobby"} ${Lt}
          </button>
          <div class="rpjs-target-dropdown-list" id="rpjs-target-dropdown"></div>
        </div>
        <input type="text" class="rpjs-chat-input" id="rpjs-chat-input" placeholder="Type a message..." autocomplete="off">
        <button class="rpjs-send-btn" id="rpjs-send-btn">${_s}</button>
      </div>
    `,document.body.appendChild(this.el),this._bindEvents(),this.updateUsers(),this.updateChat()}_getTargetName(){if(!this.chatTarget)return"Lobby";const t=this.network.getUserList().find(s=>s.id===this.chatTarget);return t?t.username:"Lobby"}_bindEvents(){this.el.querySelector("#rpjs-lobby-close").addEventListener("click",()=>{this.hide()});const e=this.el.querySelector(".rpjs-lobby-header");this._bindDragEvents(e);const t=this.el.querySelector("#rpjs-resize-handle");t&&this._bindResizeEvents(t);const s=this.el.querySelector("#rpjs-chat-input");s.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),this._sendMessage())}),this.el.querySelector("#rpjs-send-btn").addEventListener("click",()=>{this._sendMessage()}),this.el.querySelector("#rpjs-target-btn").addEventListener("click",n=>{n.stopPropagation(),this._toggleDropdown()}),document.addEventListener("click",()=>{this._closeDropdown()}),setTimeout(()=>s.focus(),100)}_bindDragEvents(e){let t=!1,s,n,i,o;const a=h=>{if(h.target.closest("button"))return;t=!0,s=h.clientX,n=h.clientY;const d=this.el.getBoundingClientRect();i=d.left,o=d.top,this.el.style.bottom="auto",this.el.style.top=o+"px",this.el.style.left=i+"px",document.addEventListener("mousemove",c),document.addEventListener("mouseup",l),h.preventDefault()},c=h=>{if(!t)return;let d=i+(h.clientX-s),g=o+(h.clientY-n);d=Math.max(0,Math.min(window.innerWidth-60,d)),g=Math.max(0,Math.min(window.innerHeight-60,g)),this.el.style.left=d+"px",this.el.style.top=g+"px"},l=()=>{t=!1,document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",l)};e.addEventListener("mousedown",a);let p=null;e.addEventListener("touchstart",h=>{if(h.target.closest("button"))return;const d=h.changedTouches[0];p=d.identifier,s=d.clientX,n=d.clientY;const g=this.el.getBoundingClientRect();i=g.left,o=g.top,this.el.style.bottom="auto",this.el.style.top=o+"px",this.el.style.left=i+"px",h.preventDefault()},{passive:!1}),e.addEventListener("touchmove",h=>{for(const d of h.changedTouches){if(d.identifier!==p)continue;let g=i+(d.clientX-s),b=o+(d.clientY-n);g=Math.max(0,Math.min(window.innerWidth-60,g)),b=Math.max(0,Math.min(window.innerHeight-60,b)),this.el.style.left=g+"px",this.el.style.top=b+"px"}h.preventDefault()},{passive:!1}),e.addEventListener("touchend",()=>{p=null})}_bindResizeEvents(e){let t=!1,s,n,i,o;const a=p=>{t=!0,s=p.clientX,n=p.clientY,i=this.el.offsetWidth,o=this.el.offsetHeight,document.addEventListener("mousemove",c),document.addEventListener("mouseup",l),p.preventDefault()},c=p=>{if(!t)return;const h=p.clientX-s,d=p.clientY-n;let g=i+h,b=o-d;g=Math.max(280,Math.min(600,g)),b=Math.max(300,Math.min(window.innerHeight*.8,b)),this.el.style.width=g+"px",this.el.style.height=b+"px"},l=()=>{t=!1,document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",l)};e.addEventListener("mousedown",a)}_sendMessage(){const e=this.el.querySelector("#rpjs-chat-input"),t=e.value.trim();t&&(this.network.sendChat(t,this.chatTarget),e.value="",e.focus())}_toggleDropdown(){this._dropdownOpen=!this._dropdownOpen;const e=this.el.querySelector("#rpjs-target-dropdown");this._dropdownOpen?(this._renderDropdownItems(),e.classList.add("rpjs-open")):e.classList.remove("rpjs-open")}_closeDropdown(){var t;this._dropdownOpen=!1;const e=(t=this.el)==null?void 0:t.querySelector("#rpjs-target-dropdown");e&&e.classList.remove("rpjs-open")}_renderDropdownItems(){const e=this.el.querySelector("#rpjs-target-dropdown"),t=this.network.getUserList(),s=this.network.myId;let n=`
      <div class="rpjs-target-dropdown-item" data-target="">
        <span style="color:rgba(255,255,255,0.5)">${Ss}</span>
        <span>Lobby (Everyone)</span>
      </div>
    `;for(const i of t)i.id!==s&&(n+=`
        <div class="rpjs-target-dropdown-item" data-target="${i.id}">
          <span class="rpjs-user-dot" style="background:${i.color}"></span>
          <span>${i.username}${i.isHub?" [Hub]":""}</span>
        </div>
      `);e.innerHTML=n,e.querySelectorAll(".rpjs-target-dropdown-item").forEach(i=>{i.addEventListener("click",o=>{o.stopPropagation();const a=i.getAttribute("data-target")||null;this.setChatTarget(a),this._closeDropdown()})})}setChatTarget(e){var s;this.chatTarget=e;const t=(s=this.el)==null?void 0:s.querySelector("#rpjs-target-btn");t&&(t.className=`rpjs-target-btn ${e?"rpjs-private-active":""}`,t.innerHTML=`${e?this._getTargetName():"Lobby"} ${Lt}`)}updateUsers(){var n;const e=(n=this.el)==null?void 0:n.querySelector("#rpjs-users-list");if(!e)return;const t=this.network.getUserList(),s=this.network.myId;e.innerHTML=t.map(i=>`
      <div class="rpjs-user-item" data-peer-id="${i.id}" title="Left-click to set as private message target. Right-click for more options.">
        <span class="rpjs-user-dot" style="background:${i.color}"></span>
        <span class="rpjs-user-name" style="color:${i.color}">${i.username}</span>
        ${i.isHub?'<span class="rpjs-user-hub-tag">HUB</span>':""}
        ${i.id===s?'<span class="rpjs-user-self-tag">YOU</span>':""}
      </div>
    `).join(""),e.querySelectorAll(".rpjs-user-item").forEach(i=>{i.addEventListener("click",()=>{const o=i.getAttribute("data-peer-id");o!==s&&this.setChatTarget(o)}),i.addEventListener("contextmenu",o=>{o.preventDefault();const a=i.getAttribute("data-peer-id");a!==s&&this._showContextMenu(o,a)})})}_showContextMenu(e,t){this._hideContextMenu();const n=this.network.getUserList().find(c=>c.id===t);if(!n)return;const i=document.createElement("div");i.className="rpjs-context-menu",i.style.left=`${e.clientX}px`,i.style.top=`${e.clientY}px`,i.innerHTML=`
      <div class="rpjs-context-menu-item" data-action="private">
        <span style="color:#ce93d8">${It}</span>
        <span>Private Message</span>
      </div>
      <div class="rpjs-context-menu-item" data-action="pong">
        <span style="color:#4fc3f7">${ks}</span>
        <span>Challenge to Pong</span>
      </div>
    `,document.body.appendChild(i),this._contextMenu=i;const o=i.getBoundingClientRect();o.right>window.innerWidth&&(i.style.left=`${window.innerWidth-o.width-8}px`),o.bottom>window.innerHeight&&(i.style.top=`${window.innerHeight-o.height-8}px`),i.querySelectorAll(".rpjs-context-menu-item").forEach(c=>{c.addEventListener("click",()=>{const l=c.getAttribute("data-action");l==="private"?this.setChatTarget(t):l==="pong"&&(this.network.sendPongInvite(t),this._addSystemMessage(`Pong challenge sent to ${n.username}!`)),this._hideContextMenu()})});const a=c=>{i.contains(c.target)||(this._hideContextMenu(),document.removeEventListener("click",a))};setTimeout(()=>document.addEventListener("click",a),0)}_hideContextMenu(){this._contextMenu&&(this._contextMenu.remove(),this._contextMenu=null)}_addSystemMessage(e){var n;const t=(n=this.el)==null?void 0:n.querySelector("#rpjs-chat-messages");if(!t)return;const s=document.createElement("div");s.className="rpjs-chat-msg rpjs-chat-system",s.textContent=e,t.appendChild(s),t.scrollTop=t.scrollHeight}updateChat(){var s;const e=(s=this.el)==null?void 0:s.querySelector("#rpjs-chat-messages");if(!e)return;const t=this.network.chatMessages;e.innerHTML=t.map(n=>n.private?`<div class="rpjs-chat-msg rpjs-chat-msg-private">
          <span class="rpjs-chat-private-label">[PM]</span>
          <span class="rpjs-chat-username" style="color:${n.color||"#ce93d8"}">${n.username}</span>
          <span class="rpjs-chat-text">${this._escapeHtml(n.text)}</span>
        </div>`:`<div class="rpjs-chat-msg">
        <span class="rpjs-chat-username" style="color:${n.color||"#4fc3f7"}">${n.username}</span>
        <span class="rpjs-chat-text">${this._escapeHtml(n.text)}</span>
      </div>`).join(""),e.scrollTop=e.scrollHeight}addChatMessage(e){var n;const t=(n=this.el)==null?void 0:n.querySelector("#rpjs-chat-messages");if(!t)return;const s=document.createElement("div");s.className=`rpjs-chat-msg ${e.private?"rpjs-chat-msg-private":""}`,s.innerHTML=`
      ${e.private?'<span class="rpjs-chat-private-label">[PM]</span>':""}
      <span class="rpjs-chat-username" style="color:${e.color||"#4fc3f7"}">${this._escapeHtml(e.username)}</span>
      <span class="rpjs-chat-text">${this._escapeHtml(e.text)}</span>
    `,t.appendChild(s),t.scrollTop=t.scrollHeight}_escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}show(){this.el||this.render(),this.el.style.display="flex"}hide(){this.el&&(this.el.style.display="none")}toggle(){this.el&&this.el.style.display!=="none"?this.hide():this.show()}isVisible(){return this.el&&this.el.style.display!=="none"}destroy(){this._hideContextMenu(),this.el&&(this.el.remove(),this.el=null)}}class Ps{constructor(e,t,s){this.network=e,this.settings={...t},this.onSettingsChange=s,this.el=null}render(){this.el&&this.el.remove();const e=document.createElement("div");e.className="rpjs-modal-overlay",e.innerHTML=`
      <div class="rpjs-modal">
        <div class="rpjs-modal-title">
          <span>Settings</span>
          <button class="rpjs-modal-close" id="rpjs-settings-close">${se}</button>
        </div>

        <div class="rpjs-field">
          <label class="rpjs-field-label">Username</label>
          <input type="text" class="rpjs-field-input" id="rpjs-settings-username" 
                 value="${this._escapeAttr(this.settings.username)}" maxlength="24">
        </div>

        <div class="rpjs-field">
          <label class="rpjs-field-label">Custom Color</label>
          <div class="rpjs-color-row">
            <input type="color" class="rpjs-color-picker" id="rpjs-settings-color-picker" 
                   value="${this.settings.color}">
            <input type="text" class="rpjs-field-input rpjs-color-hex" id="rpjs-settings-color-hex" 
                   value="${this.settings.color}" maxlength="7">
          </div>
        </div>

        <div class="rpjs-field">
          <div class="rpjs-toggle-row">
            <span class="rpjs-toggle-label">Go Offline</span>
            <button class="rpjs-toggle ${this.settings.goOffline?"rpjs-active":""}" 
                    id="rpjs-toggle-offline" role="switch" 
                    aria-checked="${this.settings.goOffline}"></button>
          </div>
        </div>

        <div class="rpjs-field">
          <div class="rpjs-toggle-row">
            <span class="rpjs-toggle-label">Dark Mode</span>
            <button class="rpjs-toggle ${this.settings.darkMode?"rpjs-active":""}" 
                    id="rpjs-toggle-darkmode" role="switch"
                    aria-checked="${this.settings.darkMode}"></button>
          </div>
        </div>

        <div class="rpjs-field">
          <div class="rpjs-toggle-row">
            <span class="rpjs-toggle-label">High Contrast / Assisted Visuals</span>
            <button class="rpjs-toggle ${this.settings.highContrast?"rpjs-active":""}" 
                    id="rpjs-toggle-highcontrast" role="switch"
                    aria-checked="${this.settings.highContrast}"></button>
          </div>
        </div>

        <button class="rpjs-save-btn" id="rpjs-settings-save">Save & Apply</button>
      </div>
    `,document.body.appendChild(e),this.el=e,this._bindEvents()}_bindEvents(){this.el.querySelector("#rpjs-settings-close").addEventListener("click",()=>{this.close()}),this.el.addEventListener("click",s=>{s.target===this.el&&this.close()});const e=this.el.querySelector("#rpjs-settings-color-picker"),t=this.el.querySelector("#rpjs-settings-color-hex");e.addEventListener("input",()=>{t.value=e.value}),t.addEventListener("input",()=>{/^#[0-9a-fA-F]{6}$/.test(t.value)&&(e.value=t.value)}),this._bindToggle("rpjs-toggle-offline","goOffline",s=>{s?this.network.goOffline():this.network.goOnline()}),this._bindToggle("rpjs-toggle-darkmode","darkMode",s=>{document.body.classList.toggle("rpjs-dark-mode",s)}),this._bindToggle("rpjs-toggle-highcontrast","highContrast",s=>{document.body.classList.toggle("rpjs-high-contrast",s)}),this.el.querySelector("#rpjs-settings-save").addEventListener("click",()=>{this._save()})}_bindToggle(e,t,s){const n=this.el.querySelector(`#${e}`);n.addEventListener("click",()=>{this.settings[t]=!this.settings[t],n.classList.toggle("rpjs-active",this.settings[t]),n.setAttribute("aria-checked",this.settings[t]),s&&s(this.settings[t])})}_save(){const e=this.el.querySelector("#rpjs-settings-username").value.trim(),t=this.el.querySelector("#rpjs-settings-color-hex").value.trim();e&&(this.settings.username=e),/^#[0-9a-fA-F]{6}$/.test(t)&&(this.settings.color=t),Rt(this.settings),this.network.updateProfile(this.settings.username,this.settings.color),this.onSettingsChange&&this.onSettingsChange(this.settings),this.close()}_escapeAttr(e){return e.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}show(){this.render()}close(){this.el&&(this.el.remove(),this.el=null)}destroy(){this.close()}}class Es{constructor(e,t,s){this.network=e,this.deck=t,this.onLaunchArena=s,this.el=null,this.followActive=!1,this._pollModal=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-hub-menu",this.el.innerHTML=`
      <div class="rpjs-hub-menu-title">Hub Controls</div>
      <div class="rpjs-hub-menu-item" id="rpjs-hub-jump">
        <span class="rpjs-hub-menu-icon">${vs}</span>
        <span class="rpjs-hub-menu-label">Jump All to Current Slide</span>
      </div>
      <div class="rpjs-hub-menu-item" id="rpjs-hub-follow">
        <span class="rpjs-hub-menu-icon">${xs}</span>
        <span class="rpjs-hub-menu-label">Follow Mode</span>
        <span class="rpjs-hub-menu-status ${this.followActive?"rpjs-on":""}" id="rpjs-follow-status">
          ${this.followActive?"ON":"OFF"}
        </span>
      </div>
      <div class="rpjs-hub-menu-item" id="rpjs-hub-poll">
        <span class="rpjs-hub-menu-icon">${Cs}</span>
        <span class="rpjs-hub-menu-label">Launch Poll</span>
      </div>
      <div class="rpjs-hub-menu-item" id="rpjs-hub-arena">
        <span class="rpjs-hub-menu-icon">${Ts}</span>
        <span class="rpjs-hub-menu-label">Launch Arena</span>
      </div>
    `,document.body.appendChild(this.el),this._bindEvents()}_bindEvents(){this.el.querySelector("#rpjs-hub-jump").addEventListener("click",()=>{const e=this.deck.getIndices();this.network.jumpAllToSlide(e.h,e.v),this._flashItem("rpjs-hub-jump")}),this.el.querySelector("#rpjs-hub-follow").addEventListener("click",()=>{this.followActive=!this.followActive,this.network.setFollowMode(this.followActive);const e=this.el.querySelector("#rpjs-follow-status");e.textContent=this.followActive?"ON":"OFF",e.className=`rpjs-hub-menu-status ${this.followActive?"rpjs-on":""}`,this.el.querySelector("#rpjs-hub-follow").classList.toggle("rpjs-active-feature",this.followActive)}),this.el.querySelector("#rpjs-hub-poll").addEventListener("click",()=>{this._showPollCreator()}),this.el.querySelector("#rpjs-hub-arena").addEventListener("click",()=>{this.onLaunchArena&&this.onLaunchArena(),this.hide()})}_flashItem(e){const t=this.el.querySelector(`#${e}`);t&&(t.style.background="rgba(255, 167, 38, 0.2)",setTimeout(()=>{t.style.background=""},300))}_showPollCreator(){this._closePollModal();const e=document.createElement("div");e.className="rpjs-modal-overlay";const t=["",""],s=i=>i.map((o,a)=>`
        <div class="rpjs-poll-answer-row">
          <input type="text" class="rpjs-poll-answer-input" 
                 data-index="${a}" placeholder="Answer ${a+1}" value="${this._escapeAttr(o)}">
          ${i.length>2?`<button class="rpjs-poll-remove-btn" data-remove="${a}">&times;</button>`:""}
        </div>
      `).join("");e.innerHTML=`
      <div class="rpjs-modal rpjs-poll-modal">
        <div class="rpjs-modal-title">
          <span>Create Poll</span>
          <button class="rpjs-modal-close" id="rpjs-poll-close">${se}</button>
        </div>
        <input type="text" class="rpjs-poll-question-input" id="rpjs-poll-question" 
               placeholder="Enter your question..." maxlength="200">
        <div class="rpjs-poll-answers" id="rpjs-poll-answers">
          ${s(t)}
        </div>
        <button class="rpjs-poll-add-btn" id="rpjs-poll-add-answer">+ Add Answer</button>
        <button class="rpjs-poll-publish-btn" id="rpjs-poll-publish">Publish Poll</button>
      </div>
    `,document.body.appendChild(e),this._pollModal=e,e.querySelector("#rpjs-poll-close").addEventListener("click",()=>{this._closePollModal()}),e.addEventListener("click",i=>{i.target===e&&this._closePollModal()});const n=()=>{e.querySelectorAll(".rpjs-poll-answer-input").forEach(o=>{const a=parseInt(o.getAttribute("data-index"));isNaN(a)||(t[a]=o.value)})};e.addEventListener("click",i=>{if(i.target.classList.contains("rpjs-poll-remove-btn")){n();const o=parseInt(i.target.getAttribute("data-remove"));t.splice(o,1),e.querySelector(".rpjs-poll-answers").innerHTML=s(t)}}),e.querySelector("#rpjs-poll-add-answer").addEventListener("click",()=>{n(),t.length<8&&(t.push(""),e.querySelector(".rpjs-poll-answers").innerHTML=s(t))}),e.querySelector("#rpjs-poll-publish").addEventListener("click",()=>{n();const i=e.querySelector("#rpjs-poll-question").value.trim(),o=t.map(l=>l.trim()).filter(l=>l);if(!i||o.length<2)return;const c={pollId:`poll-${Date.now()}`,question:i,answers:o,fromUsername:this.network.myUser.username,timeout:10};this.network.startPoll(c),this._startPollCollector(c),this._closePollModal()})}_startPollCollector(e){const t=new Map;let s=e.timeout;const n=setInterval(()=>{s--,s<=0&&(clearInterval(n),this._showPollResults(e,t))},1e3),i=o=>{o.pollId===e.pollId&&t.set(o.from,o.answer)};this.network.on("poll-answer",i),setTimeout(()=>{this.network.off("poll-answer",i)},(e.timeout+2)*1e3)}_showPollResults(e,t){const s={};e.answers.forEach(o=>s[o]=0);for(const[,o]of t)s[o]!==void 0&&s[o]++;const n=t.size||1,i={pollId:e.pollId,question:e.question,answers:e.answers.map(o=>({text:o,count:s[o]||0,percentage:Math.round((s[o]||0)/n*100)})),totalResponses:t.size};this.network.sendPollResults(i),this._renderPollResults(i)}_renderPollResults(e){const t=document.createElement("div");t.className="rpjs-modal-overlay",t.innerHTML=`
      <div class="rpjs-modal rpjs-poll-results-card">
        <div class="rpjs-modal-title">
          <span>Poll Results</span>
          <button class="rpjs-modal-close" id="rpjs-results-close">${se}</button>
        </div>
        <div style="margin-bottom:12px;font-size:14px;color:rgba(255,255,255,0.7)">${this._escapeHtml(e.question)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:12px">${e.totalResponses} response${e.totalResponses!==1?"s":""}</div>
        ${e.answers.map(s=>`
          <div class="rpjs-poll-result-row">
            <div class="rpjs-poll-result-label">
              <span>${this._escapeHtml(s.text)}</span>
              <span>${s.count} (${s.percentage}%)</span>
            </div>
            <div class="rpjs-poll-result-bar-bg">
              <div class="rpjs-poll-result-bar-fill" style="width:${s.percentage}%"></div>
            </div>
          </div>
        `).join("")}
      </div>
    `,document.body.appendChild(t),t.querySelector("#rpjs-results-close").addEventListener("click",()=>{t.remove()}),t.addEventListener("click",s=>{s.target===t&&t.remove()})}_closePollModal(){this._pollModal&&(this._pollModal.remove(),this._pollModal=null)}_escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}_escapeAttr(e){return e.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}show(){this.el||this.render(),this.el.style.display="block"}hide(){this.el&&(this.el.style.display="none")}toggle(){this.el&&this.el.style.display!=="none"?this.hide():this.show()}destroy(){this._closePollModal(),this.el&&(this.el.remove(),this.el=null)}}class Mt{constructor(e,t=!0,s=null,{onStart:n,onStop:i}={}){this.network=e,this.isInitiator=t,this.opponentPeerId=s,this._onStartCb=n||null,this._onStopCb=i||null,this.el=null,this.canvas=null,this.ctx=null,this.running=!1,this.animFrame=null,this.W=0,this.H=0,this.PADDLE_W=12,this.PADDLE_H=80,this.BALL_R=8,this.PADDLE_MARGIN=20,this.leftY=0,this.rightY=0,this.mouseY=0,this.ball={x:0,y:0,vx:0,vy:0},this.scoreLeft=0,this.scoreRight=0,this.baseSpeed=4,this.currentSpeed=4,this.hitCount=0,this._onPongMove=null,this._onPongAccept=null,this._onPongDecline=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-pong-overlay",this.el.innerHTML=`
      <canvas class="rpjs-pong-canvas" id="rpjs-pong-canvas"></canvas>
      <div class="rpjs-pong-hud">
        <span class="rpjs-pong-score" id="rpjs-pong-left-score">0</span>
        <span class="rpjs-pong-divider">:</span>
        <span class="rpjs-pong-score" id="rpjs-pong-right-score">0</span>
      </div>
      <div class="rpjs-pong-players" id="rpjs-pong-players"></div>
      <button class="rpjs-pong-exit" id="rpjs-pong-exit">Exit [Esc]</button>
    `,document.body.appendChild(this.el),this.canvas=this.el.querySelector("#rpjs-pong-canvas"),this.ctx=this.canvas.getContext("2d"),this._resize(),this._resetBall(),this._bindEvents(),this._updatePlayerNames(),this._onPongMove=e=>{if(e.from===this.opponentPeerId){const t=e.y*this.H;this.isInitiator?this.rightY=t:this.leftY=t}},this.network.on("pong-move",this._onPongMove)}_updatePlayerNames(){const t=this.network.getUserList().find(o=>o.id===this.opponentPeerId),s=this.network.myUser.username,n=t?t.username:"Opponent",i=this.el.querySelector("#rpjs-pong-players");this.isInitiator?i.innerHTML=`<span style="color:${this.network.myUser.color}">${s} (Left)</span> vs <span style="color:${(t==null?void 0:t.color)||"#fff"}">${n} (Right)</span>`:i.innerHTML=`<span style="color:${(t==null?void 0:t.color)||"#fff"}">${n} (Left)</span> vs <span style="color:${this.network.myUser.color}">${s} (Right)</span>`}_resize(){this.W=window.innerWidth,this.H=window.innerHeight,this.canvas.width=this.W,this.canvas.height=this.H,this.leftY=this.H/2,this.rightY=this.H/2}_resetBall(){this.ball.x=this.W/2,this.ball.y=this.H/2;const e=(Math.random()*.5-.25)*Math.PI,t=Math.random()>.5?1:-1;this.currentSpeed=this.baseSpeed,this.hitCount=0,this.ball.vx=Math.cos(e)*this.currentSpeed*t,this.ball.vy=Math.sin(e)*this.currentSpeed}_bindEvents(){this._mouseHandler=e=>{this.mouseY=e.clientY,this.isInitiator?this.leftY=this.mouseY:this.rightY=this.mouseY;const t=this.mouseY/this.H;this.network.sendPongMove(this.opponentPeerId,Math.max(0,Math.min(1,t)))},this.el.addEventListener("mousemove",this._mouseHandler),this._touchHandler=e=>{e.preventDefault();const t=e.touches[0];this.mouseY=t.clientY,this.isInitiator?this.leftY=this.mouseY:this.rightY=this.mouseY;const s=this.mouseY/this.H;this.network.sendPongMove(this.opponentPeerId,Math.max(0,Math.min(1,s)))},this.el.addEventListener("touchstart",this._touchHandler,{passive:!1}),this.el.addEventListener("touchmove",this._touchHandler,{passive:!1}),this.el.querySelector("#rpjs-pong-exit").addEventListener("click",()=>{this.stop()}),this._keyHandler=e=>{e.stopImmediatePropagation(),e.key==="Escape"&&this.stop()},document.addEventListener("keydown",this._keyHandler,!0),this._resizeHandler=()=>this._resize(),window.addEventListener("resize",this._resizeHandler)}start(){this.render(),this.running=!0,this._onStartCb&&this._onStartCb(),this._loop()}stop(){this.running=!1,this.animFrame&&(cancelAnimationFrame(this.animFrame),this.animFrame=null),this._onPongMove&&this.network.off("pong-move",this._onPongMove),document.removeEventListener("keydown",this._keyHandler,!0),window.removeEventListener("resize",this._resizeHandler),this.el&&(this.el.remove(),this.el=null),this._onStopCb&&this._onStopCb()}_loop(){this.running&&(this._update(),this._draw(),this.animFrame=requestAnimationFrame(()=>this._loop()))}_update(){this.ball.x+=this.ball.vx,this.ball.y+=this.ball.vy,(this.ball.y-this.BALL_R<=0||this.ball.y+this.BALL_R>=this.H)&&(this.ball.vy*=-1,this.ball.y=Math.max(this.BALL_R,Math.min(this.H-this.BALL_R,this.ball.y)));const e=this.PADDLE_MARGIN;this.ball.x-this.BALL_R<=e+this.PADDLE_W&&this.ball.x-this.BALL_R>=e&&this.ball.y>=this.leftY-this.PADDLE_H/2&&this.ball.y<=this.leftY+this.PADDLE_H/2&&this._handlePaddleHit(1);const t=this.W-this.PADDLE_MARGIN-this.PADDLE_W;this.ball.x+this.BALL_R>=t&&this.ball.x+this.BALL_R<=t+this.PADDLE_W&&this.ball.y>=this.rightY-this.PADDLE_H/2&&this.ball.y<=this.rightY+this.PADDLE_H/2&&this._handlePaddleHit(-1),this.ball.x<0&&(this.scoreRight++,this._updateScore(),this.scoreRight>=10?this._gameOver("right"):this._resetBall()),this.ball.x>this.W&&(this.scoreLeft++,this._updateScore(),this.scoreLeft>=10?this._gameOver("left"):this._resetBall())}_handlePaddleHit(e){this.hitCount++,this.currentSpeed=this.baseSpeed+this.hitCount*.3;const t=(Math.random()*.6-.3)*Math.PI;this.ball.vx=Math.cos(t)*this.currentSpeed*e,this.ball.vy=Math.sin(t)*this.currentSpeed}_draw(){const e=this.ctx;e.clearRect(0,0,this.W,this.H),e.setLineDash([8,8]),e.strokeStyle="rgba(255, 255, 255, 0.15)",e.lineWidth=2,e.beginPath(),e.moveTo(this.W/2,0),e.lineTo(this.W/2,this.H),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(79, 195, 247, 0.8)";const t=this.PADDLE_MARGIN;e.beginPath(),e.roundRect(t,this.leftY-this.PADDLE_H/2,this.PADDLE_W,this.PADDLE_H,4),e.fill(),e.fillStyle="rgba(255, 167, 38, 0.8)";const s=this.W-this.PADDLE_MARGIN-this.PADDLE_W;e.beginPath(),e.roundRect(s,this.rightY-this.PADDLE_H/2,this.PADDLE_W,this.PADDLE_H,4),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.9)",e.beginPath(),e.arc(this.ball.x,this.ball.y,this.BALL_R,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.15)",e.beginPath(),e.arc(this.ball.x,this.ball.y,this.BALL_R*2.5,0,Math.PI*2),e.fill()}_updateScore(){var s,n;const e=(s=this.el)==null?void 0:s.querySelector("#rpjs-pong-left-score"),t=(n=this.el)==null?void 0:n.querySelector("#rpjs-pong-right-score");e&&(e.textContent=this.scoreLeft),t&&(t.textContent=this.scoreRight)}_gameOver(e){this.running=!1;const s=e==="left"&&this.isInitiator||e==="right"&&!this.isInitiator?this.network.myUser.username:"Opponent",n=this.ctx;n.fillStyle="rgba(0, 0, 0, 0.5)",n.fillRect(0,0,this.W,this.H),n.fillStyle="#fff",n.font="bold 48px -apple-system, sans-serif",n.textAlign="center",n.fillText(`${s} Wins!`,this.W/2,this.H/2-20),n.font="20px -apple-system, sans-serif",n.fillStyle="rgba(255, 255, 255, 0.6)",n.fillText("Click or press any key to close",this.W/2,this.H/2+30);const i=()=>{this.stop()};this.el.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0})}}const v=14,Dt=22,At=3,wt=5,ne=8,Ot=8,$t=300,xe=8,Rs=2,Ce=.12,Is=.02,Ht=40,Ls=350,Ms=18,Nt=40,Ds=140,As=v+4,ws=50,Os=33;function Ut(r,e,t,s){return Math.sqrt((t-r)**2+(s-e)**2)}function D(r,e,t){return Math.max(e,Math.min(t,r))}function $s(r,e,t,s,n,i,o){const a=t-r,c=s-e,l=r-n,p=e-i,h=a*a+c*c,d=2*(l*a+p*c),g=l*l+p*p-o*o;let b=d*d-4*h*g;if(b<0)return!1;b=Math.sqrt(b);const u=(-d-b)/(2*h),y=(-d+b)/(2*h);return u>=0&&u<=1||y>=0&&y<=1||u<0&&y>1}function Hs(r,e,t,s,n,i,o,a){const c=(r-t)*(i-a)-(e-s)*(n-o);if(Math.abs(c)<1e-4)return!1;const l=((r-n)*(i-a)-(e-i)*(n-o))/c,p=-((r-t)*(e-i)-(e-s)*(r-n))/c;return l>=0&&l<=1&&p>=0&&p<=1}function Bt(r){let e=r;return function(){return e=e*1103515245+12345&2147483647,e/2147483647}}function zt(r,e,t){const s=Bt(t),n=[],i=60;for(let o=0;o<Ms;o++){const a=i+s()*(r-i*2),c=i+s()*(e-i*2),l=s()*Math.PI,h=(Nt+s()*(Ds-Nt))/2;n.push({x1:a-Math.cos(l)*h,y1:c-Math.sin(l)*h,x2:a+Math.cos(l)*h,y2:c+Math.sin(l)*h})}return n}class ke{constructor(e,t,{onStart:s,onStop:n}={}){Re(this,"_hitFlashes",[]);Re(this,"_sparks",[]);this.network=e,this.isHub=t,this._onStartCb=s||null,this._onStopCb=n||null,this.el=null,this.canvas=null,this.ctx=null,this.running=!1,this.animFrame=null,this.W=0,this.H=0,this.players=new Map,this.walls=[],this.bullets=[],this.seed=0,this.gameId=null,this.keysDown=new Set,this.mouseX=0,this.mouseY=0,this.lastShootTime=0,this.touchDx=0,this.touchDy=0,this._joystickTouchId=null,this._joystickCenter=null,this._shootTouchInterval=null,this._isTouchDevice=!1,this._stateBroadcastInterval=null,this._inputSendInterval=null,this._onArenaState=null,this._onArenaInput=null,this._onArenaShoot=null,this._onArenaHit=null,this._onArenaEnd=null,this._keyDownHandler=null,this._keyUpHandler=null,this._mouseMoveHandler=null,this._resizeHandler=null}start(e){this.gameId=e.gameId,this.seed=e.seed,this._render(),this._resize(),this.walls=zt(this.W,this.H,this.seed);const t=this.network.getUserList(),s=this.network.myUser;s&&!t.find(o=>o.id===s.id)&&(t.push({id:s.id,username:s.username,color:s.color,isHub:s.isHub,number:s.number}),t.sort((o,a)=>o.isHub&&!a.isHub?-1:!o.isHub&&a.isHub?1:(o.number||0)-(a.number||0)));const n=80,i=Bt(this.seed+999);for(const o of t){const a=n+i()*(this.W-n*2),c=n+i()*(this.H-n*2);this.players.set(o.id,{x:a,y:c,angle:0,color:o.color,username:o.username,hitCount:0,eliminated:!1})}this._bindEvents(),this.running=!0,this.isHub?this._stateBroadcastInterval=setInterval(()=>{this._hubBroadcastState()},ws):this._inputSendInterval=setInterval(()=>{this._sendInput()},Os),this._onArenaState=o=>this._handleStateUpdate(o),this._onArenaInput=o=>this._handleRemoteInput(o),this._onArenaShoot=o=>this._handleRemoteShoot(o),this._onArenaHit=o=>this._handleRemoteHit(o),this._onArenaEnd=o=>this._handleEnd(o),this.network.on("arena-state",this._onArenaState),this.network.on("arena-input",this._onArenaInput),this.network.on("arena-shoot",this._onArenaShoot),this.network.on("arena-hit",this._onArenaHit),this.network.on("arena-end",this._onArenaEnd),this._onStartCb&&this._onStartCb(),this._loop()}static triggerStart(e){const t={gameId:`arena-${Date.now()}`,seed:Math.floor(Math.random()*1e5)};return e.startArena(t),t}_render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-arena-overlay",this.el.innerHTML=`
      <canvas class="rpjs-arena-canvas" id="rpjs-arena-canvas"></canvas>
      <div class="rpjs-arena-hud">
        <span class="rpjs-arena-hud-title">Arena</span>
        <span id="rpjs-arena-player-count"></span>
      </div>
      <button class="rpjs-arena-exit" id="rpjs-arena-exit">Exit [Esc]</button>
      <div class="rpjs-arena-controls">WASD / HJKL to move &middot; Mouse to aim &middot; Click / Space to shoot</div>
      <div class="rpjs-arena-touch-controls">
        <div class="rpjs-arena-joystick" id="rpjs-arena-joystick">
          <div class="rpjs-arena-joystick-knob" id="rpjs-arena-joystick-knob"></div>
        </div>
        <button class="rpjs-arena-shoot-btn" id="rpjs-arena-shoot-btn">FIRE</button>
      </div>
      <div class="rpjs-arena-scoreboard" id="rpjs-arena-scoreboard"></div>
    `,document.body.appendChild(this.el),this.canvas=this.el.querySelector("#rpjs-arena-canvas"),this.ctx=this.canvas.getContext("2d")}_resize(){this.W=window.innerWidth,this.H=window.innerHeight,this.canvas.width=this.W,this.canvas.height=this.H,this.seed&&(this.walls=zt(this.W,this.H,this.seed))}_bindEvents(){this._keyDownHandler=e=>{e.preventDefault(),e.stopImmediatePropagation();const t=e.key.toLowerCase();this.keysDown.add(t),t===" "&&this.running&&this._shoot(),t==="escape"&&this.stop()},this._keyUpHandler=e=>{e.stopImmediatePropagation(),this.keysDown.delete(e.key.toLowerCase())},this._mouseMoveHandler=e=>{this.mouseX=e.clientX,this.mouseY=e.clientY;const t=this.players.get(this.network.myId);t&&(t.angle=Math.atan2(this.mouseY-t.y,this.mouseX-t.x))},this._resizeHandler=()=>this._resize(),document.addEventListener("keydown",this._keyDownHandler,!0),document.addEventListener("keyup",this._keyUpHandler,!0),this._mouseDownHandler=e=>{e.button===0&&this.running&&this._shoot()},this.el.addEventListener("mousemove",this._mouseMoveHandler),this.canvas.addEventListener("mousedown",this._mouseDownHandler),window.addEventListener("resize",this._resizeHandler),this.el.querySelector("#rpjs-arena-exit").addEventListener("click",()=>{this.stop()}),this._bindTouchEvents()}_bindTouchEvents(){if(this._isTouchDevice="ontouchstart"in window||navigator.maxTouchPoints>0,!this._isTouchDevice)return;const e=this.el.querySelector("#rpjs-arena-joystick"),t=this.el.querySelector("#rpjs-arena-joystick-knob"),s=this.el.querySelector("#rpjs-arena-shoot-btn"),n=55,i=l=>{l.preventDefault();const p=l.changedTouches[0];this._joystickTouchId=p.identifier;const h=e.getBoundingClientRect();this._joystickCenter={x:h.left+h.width/2,y:h.top+h.height/2}},o=l=>{l.preventDefault();for(const p of l.changedTouches){if(p.identifier!==this._joystickTouchId)continue;const h=p.clientX-this._joystickCenter.x,d=p.clientY-this._joystickCenter.y,g=Math.sqrt(h*h+d*d);if(g>8){const b=Math.min(g,n);this.touchDx=h/g,this.touchDy=d/g,t.style.transform=`translate(calc(-50% + ${h/g*b}px), calc(-50% + ${d/g*b}px))`}else this.touchDx=0,this.touchDy=0,t.style.transform="translate(-50%, -50%)"}},a=l=>{for(const p of l.changedTouches)p.identifier===this._joystickTouchId&&(this._joystickTouchId=null,this.touchDx=0,this.touchDy=0,t.style.transform="translate(-50%, -50%)")};e.addEventListener("touchstart",i,{passive:!1}),e.addEventListener("touchmove",o,{passive:!1}),e.addEventListener("touchend",a),e.addEventListener("touchcancel",a),s.addEventListener("touchstart",l=>{l.preventDefault(),this._shoot(),this._shootTouchInterval=setInterval(()=>this._shoot(),$t+50)},{passive:!1});const c=()=>{this._shootTouchInterval&&(clearInterval(this._shootTouchInterval),this._shootTouchInterval=null)};s.addEventListener("touchend",c),s.addEventListener("touchcancel",c),this._canvasTouchHandler=l=>{l.preventDefault();for(const p of l.touches){if(p.identifier===this._joystickTouchId)continue;const h=document.elementFromPoint(p.clientX,p.clientY);if(h&&(h===s||e.contains(h)))continue;this.mouseX=p.clientX,this.mouseY=p.clientY;const d=this.players.get(this.network.myId);d&&(d.angle=Math.atan2(p.clientY-d.y,p.clientX-d.x));break}},this.canvas.addEventListener("touchstart",this._canvasTouchHandler,{passive:!1}),this.canvas.addEventListener("touchmove",this._canvasTouchHandler,{passive:!1})}_unbindEvents(){document.removeEventListener("keydown",this._keyDownHandler,!0),document.removeEventListener("keyup",this._keyUpHandler,!0),this.el&&this.el.removeEventListener("mousemove",this._mouseMoveHandler),window.removeEventListener("resize",this._resizeHandler),this._onArenaState&&this.network.off("arena-state",this._onArenaState),this._onArenaInput&&this.network.off("arena-input",this._onArenaInput),this._onArenaShoot&&this.network.off("arena-shoot",this._onArenaShoot),this._onArenaHit&&this.network.off("arena-hit",this._onArenaHit),this._onArenaEnd&&this.network.off("arena-end",this._onArenaEnd)}_sendInput(){const e=this.players.get(this.network.myId);if(!e||e.eliminated)return;let t=0,s=0;if((this.keysDown.has("h")||this.keysDown.has("a"))&&(t-=1),(this.keysDown.has("l")||this.keysDown.has("d"))&&(t+=1),(this.keysDown.has("k")||this.keysDown.has("w"))&&(s-=1),(this.keysDown.has("j")||this.keysDown.has("s"))&&(s+=1),t+=this.touchDx,s+=this.touchDy,t===0&&s===0)return;const n=e.hitCount>0?wt:At,i=Math.sqrt(t*t+s*s),o=i>1?i:1;t=t/o*n,s=s/o*n,e.x=D(e.x+t,v,this.W-v),e.y=D(e.y+s,v,this.H-v),this._resolveWalls(e),this.network.sendArenaInput({x:e.x,y:e.y,angle:e.angle})}_shoot(){const e=this.players.get(this.network.myId);if(!e||e.eliminated)return;const t=Date.now();if(t-this.lastShootTime<$t)return;this.lastShootTime=t;const s=Ut(e.x,e.y,this.mouseX,this.mouseY),n=D((s-Ht)/(Ls-Ht),0,1),i=Math.round(xe+(Rs-xe)*n),o=Ce+(Is-Ce)*n,a={x:e.x,y:e.y,angle:e.angle,color:e.color,count:i,spread:o};this._createBullets(this.network.myId,a),this.network.sendArenaShoot(a)}_createBullets(e,t){const s=t.count||xe,n=t.spread!=null?t.spread:Ce;for(let i=0;i<s;i++){const o=t.angle+(i-(s-1)/2)*n;this.bullets.push({x:t.x+Math.cos(t.angle)*(v+4),y:t.y+Math.sin(t.angle)*(v+4),vx:Math.cos(o)*ne,vy:Math.sin(o)*ne,from:e,color:t.color,life:120})}}_resolveWalls(e){for(const t of this.walls)if($s(t.x1,t.y1,t.x2,t.y2,e.x,e.y,v)){const s=t.x2-t.x1,n=t.y2-t.y1,i=s*s+n*n;let o=((e.x-t.x1)*s+(e.y-t.y1)*n)/i;o=D(o,0,1);const a=t.x1+o*s,c=t.y1+o*n,l=e.x-a,p=e.y-c,h=Math.sqrt(l*l+p*p);if(h<v&&h>.01){const d=v-h+1;e.x+=l/h*d,e.y+=p/h*d}}}_handleRemoteInput(e){if(!this.isHub)return;const t=this.players.get(e.from);!t||t.eliminated||(t.x=D(e.x,v,this.W-v),t.y=D(e.y,v,this.H-v),t.angle=e.angle,this._resolveWalls(t))}_handleRemoteShoot(e){this.isHub&&this._createBullets(e.from,e)}_handleRemoteHit(e){const t=this.players.get(e.targetId);t&&(t.hitCount=e.hitCount,t.eliminated=e.eliminated),this._hitFlashes.push({x:e.x,y:e.y,time:10,color:e.color||"#fff"})}_hubBroadcastState(){const e={};for(const[s,n]of this.players)e[s]={x:Math.round(n.x*10)/10,y:Math.round(n.y*10)/10,angle:Math.round(n.angle*100)/100,hitCount:n.hitCount,eliminated:n.eliminated};const t=this.bullets.map(s=>({x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,vx:Math.round(s.vx*10)/10,vy:Math.round(s.vy*10)/10,from:s.from,color:s.color,life:s.life}));this.network.broadcastArenaState({gameId:this.gameId,players:e,bullets:t})}_handleStateUpdate(e){if(!this.isHub){for(const[t,s]of Object.entries(e.players||{})){let n=this.players.get(t);n||(n={x:s.x,y:s.y,angle:s.angle,color:"#4fc3f7",username:"?",hitCount:0,eliminated:!1},this.players.set(t,n)),t!==this.network.myId&&(n.x=s.x,n.y=s.y,n.angle=s.angle),n.hitCount=s.hitCount,n.eliminated=s.eliminated}this.bullets=(e.bullets||[]).map(t=>({...t}))}}_loop(){this.running&&(this.isHub?this._updateHub():this._updateClient(),this.running&&(this._draw(),this._updateScoreboard(),this.animFrame=requestAnimationFrame(()=>this._loop())))}_updateHub(){const e=this.players.get(this.network.myId);if(e&&!e.eliminated){let t=0,s=0;if((this.keysDown.has("h")||this.keysDown.has("a"))&&(t-=1),(this.keysDown.has("l")||this.keysDown.has("d"))&&(t+=1),(this.keysDown.has("k")||this.keysDown.has("w"))&&(s-=1),(this.keysDown.has("j")||this.keysDown.has("s"))&&(s+=1),t+=this.touchDx,s+=this.touchDy,t!==0||s!==0){const n=e.hitCount>0?wt:At,i=Math.sqrt(t*t+s*s),o=i>1?i:1;e.x=D(e.x+t/o*n,v,this.W-v),e.y=D(e.y+s/o*n,v,this.H-v),this._resolveWalls(e)}e.angle=Math.atan2(this.mouseY-e.y,this.mouseX-e.x)}this._updateBullets(),this._checkBulletCollisions()}_updateClient(){const e=this.players.get(this.network.myId);e&&!e.eliminated&&(e.angle=Math.atan2(this.mouseY-e.y,this.mouseX-e.x)),this._updateBullets()}_updateBullets(){for(let e=this.bullets.length-1;e>=0;e--){const t=this.bullets[e];if(t.x+=t.vx,t.y+=t.vy,t.life--,t.x<-20||t.x>this.W+20||t.y<-20||t.y>this.H+20||t.life<=0){this.bullets.splice(e,1);continue}let s=!1;for(const n of this.walls)if(Hs(t.x-t.vx,t.y-t.vy,t.x,t.y,n.x1,n.y1,n.x2,n.y2)){s=!0;break}s&&(this._sparks.push({x:t.x,y:t.y,life:6,color:t.color}),this.bullets.splice(e,1))}}_checkBulletCollisions(){if(this.isHub)for(let e=this.bullets.length-1;e>=0;e--){const t=this.bullets[e];for(const[s,n]of this.players){if(s===t.from||n.eliminated)continue;if(Ut(t.x,t.y,n.x,n.y)<As){n.hitCount++,n.hitCount>=2&&(n.eliminated=!0);const o={targetId:s,hitCount:n.hitCount,eliminated:n.eliminated,x:n.x,y:n.y,color:n.color};this.network.broadcastArenaHit(o),this._hitFlashes.push({x:n.x,y:n.y,time:15,color:"#fff"}),this._sparks.push({x:t.x,y:t.y,life:8,color:t.color}),this.bullets.splice(e,1),this._checkGameOver();break}}}}_checkGameOver(){const e=[];for(const[t,s]of this.players)s.eliminated||e.push({id:t,username:s.username,color:s.color});e.length<=1&&this.network.broadcastArenaEnd({gameId:this.gameId,winner:e[0]||null,standings:Array.from(this.players.entries()).map(([t,s])=>({id:t,username:s.username,color:s.color,hitCount:s.hitCount,eliminated:s.eliminated}))})}_handleEnd(e){this.running=!1,this._draw();const t=this.ctx;t.fillStyle="rgba(0, 0, 0, 0.6)",t.fillRect(0,0,this.W,this.H),t.textAlign="center",t.fillStyle="#fff",t.font="bold 36px -apple-system, sans-serif",e.winner?t.fillText(`${e.winner.username} Wins!`,this.W/2,this.H/2-20):t.fillText("Draw!",this.W/2,this.H/2-20),t.font="16px -apple-system, sans-serif",t.fillStyle="rgba(255,255,255,0.5)",t.fillText("Click or press any key to close",this.W/2,this.H/2+20);const s=()=>this.stop();this.el.addEventListener("click",s,{once:!0}),document.addEventListener("keydown",s,{once:!0})}_draw(){const e=this.ctx;e.clearRect(0,0,this.W,this.H),e.strokeStyle="rgba(255, 255, 255, 0.03)",e.lineWidth=1;const t=60;for(let i=0;i<this.W;i+=t)e.beginPath(),e.moveTo(i,0),e.lineTo(i,this.H),e.stroke();for(let i=0;i<this.H;i+=t)e.beginPath(),e.moveTo(0,i),e.lineTo(this.W,i),e.stroke();e.strokeStyle="rgba(255, 255, 255, 0.4)",e.lineWidth=3,e.lineCap="round";for(const i of this.walls)e.beginPath(),e.moveTo(i.x1,i.y1),e.lineTo(i.x2,i.y2),e.stroke();e.strokeStyle="rgba(255, 255, 255, 0.08)",e.lineWidth=8;for(const i of this.walls)e.beginPath(),e.moveTo(i.x1,i.y1),e.lineTo(i.x2,i.y2),e.stroke();for(const i of this.bullets){const o=i.x-i.vx/ne*Ot,a=i.y-i.vy/ne*Ot;e.strokeStyle=i.color||"rgba(255, 255, 255, 0.8)",e.lineWidth=2,e.lineCap="round",e.beginPath(),e.moveTo(o,a),e.lineTo(i.x,i.y),e.stroke(),e.strokeStyle=(i.color||"rgba(255,255,255,0.8)").replace(")",",0.3)").replace("rgb","rgba"),e.lineWidth=5,e.beginPath(),e.moveTo(o,a),e.lineTo(i.x,i.y),e.stroke()}for(let i=this._sparks.length-1;i>=0;i--){const o=this._sparks[i];e.fillStyle=`rgba(255, 200, 50, ${o.life/8})`,e.beginPath(),e.arc(o.x,o.y,3*(o.life/8),0,Math.PI*2),e.fill(),o.life--,o.life<=0&&this._sparks.splice(i,1)}for(let i=this._hitFlashes.length-1;i>=0;i--){const o=this._hitFlashes[i];e.fillStyle=`rgba(255, 255, 255, ${o.time/15*.4})`,e.beginPath(),e.arc(o.x,o.y,v*2*(1-o.time/15)+v,0,Math.PI*2),e.fill(),o.time--,o.time<=0&&this._hitFlashes.splice(i,1)}const s=this.network.myId;for(const[i,o]of this.players){const a=i===s,c=o.eliminated?.2:1;e.save(),e.globalAlpha=c,o.eliminated?(e.strokeStyle=o.color,e.lineWidth=2,e.beginPath(),e.arc(o.x,o.y,v,0,Math.PI*2),e.stroke(),e.beginPath(),e.moveTo(o.x-6,o.y-6),e.lineTo(o.x+6,o.y+6),e.moveTo(o.x+6,o.y-6),e.lineTo(o.x-6,o.y+6),e.stroke()):(o.hitCount>0?(e.fillStyle=o.color,e.beginPath(),e.arc(o.x,o.y,v,-Math.PI/2,Math.PI/2),e.fill(),e.strokeStyle=o.color,e.lineWidth=2,e.beginPath(),e.arc(o.x,o.y,v,Math.PI/2,-Math.PI/2),e.stroke()):(e.fillStyle=o.color,e.beginPath(),e.arc(o.x,o.y,v,0,Math.PI*2),e.fill()),e.strokeStyle="rgba(255,255,255,0.4)",e.lineWidth=1.5,e.beginPath(),e.arc(o.x,o.y,v,0,Math.PI*2),e.stroke(),a&&(e.strokeStyle=o.color,e.lineWidth=3,e.lineCap="round",e.beginPath(),e.moveTo(o.x+Math.cos(o.angle)*v,o.y+Math.sin(o.angle)*v),e.lineTo(o.x+Math.cos(o.angle)*(v+Dt),o.y+Math.sin(o.angle)*(v+Dt)),e.stroke()),e.fillStyle="rgba(255,255,255,0.7)",e.font="10px -apple-system, sans-serif",e.textAlign="center",e.fillText(o.username,o.x,o.y+v+14)),e.restore()}const n=this.players.get(s);n&&!n.eliminated&&(e.strokeStyle="rgba(255,255,255,0.3)",e.lineWidth=1,e.beginPath(),e.arc(this.mouseX,this.mouseY,8,0,Math.PI*2),e.stroke(),e.beginPath(),e.moveTo(this.mouseX-12,this.mouseY),e.lineTo(this.mouseX+12,this.mouseY),e.moveTo(this.mouseX,this.mouseY-12),e.lineTo(this.mouseX,this.mouseY+12),e.stroke())}_updateScoreboard(){var i;const e=(i=this.el)==null?void 0:i.querySelector("#rpjs-arena-scoreboard");if(!e)return;const t=this.network.myId;let s='<div style="font-weight:600;margin-bottom:4px;color:rgba(255,255,255,0.9)">Players</div>';const n=Array.from(this.players.entries()).sort((o,a)=>o[1].eliminated&&!a[1].eliminated?1:!o[1].eliminated&&a[1].eliminated?-1:o[1].hitCount-a[1].hitCount);for(const[o,a]of n){const c=o===t,l=a.eliminated||a.hitCount>0?"hit":"alive",p=a.eliminated?"OUT":a.hitCount>0?"HURT":"OK";s+=`<div class="rpjs-arena-scoreboard-row">
        <span class="rpjs-arena-scoreboard-name">
          <span style="width:6px;height:6px;border-radius:50%;background:${a.color};display:inline-block"></span>
          <span style="${c?"font-weight:600":""}">${a.username}</span>
        </span>
        <span class="rpjs-arena-scoreboard-hp ${l}">${p}</span>
      </div>`}e.innerHTML=s}stop(){this.running=!1,this.animFrame&&(cancelAnimationFrame(this.animFrame),this.animFrame=null),this._stateBroadcastInterval&&(clearInterval(this._stateBroadcastInterval),this._stateBroadcastInterval=null),this._inputSendInterval&&(clearInterval(this._inputSendInterval),this._inputSendInterval=null),this._shootTouchInterval&&(clearInterval(this._shootTouchInterval),this._shootTouchInterval=null),this._unbindEvents(),this.el&&(this.el.remove(),this.el=null),this.players.clear(),this.bullets=[],this._hitFlashes=[],this._sparks=[],this._onStopCb&&this._onStopCb()}}return()=>({id:"peerjs",init(r){console.log("[RevealPeerJS] Plugin initializing..."),ms();const e=fs(),t=new us;let s=null,n=null,i=null,o=null,a=null;const c={onStart:()=>r.configure({keyboard:!1}),onStop:()=>r.configure({keyboard:!0})};function l(){a&&(a.stop(),a=null);const u=ke.triggerStart(t);a=new ke(t,!0,c),a.start(u)}const p=document.createElement("div");p.className="rpjs-toolbar",p.innerHTML=`
      <button id="rpjs-btn-lobby" title="Lobby & Chat">${It}</button>
      <button id="rpjs-btn-settings" title="Settings">${bs}</button>
    `,console.log("[RevealPeerJS] Creating toolbar and appending to body..."),document.body.appendChild(p),console.log("[RevealPeerJS] Toolbar appended. Visible:",p.offsetParent!==null),document.getElementById("rpjs-btn-lobby").addEventListener("click",()=>{s||(s=new js(t,e)),s.toggle(),document.getElementById("rpjs-btn-lobby").classList.toggle("rpjs-active",s.isVisible())}),document.getElementById("rpjs-btn-settings").addEventListener("click",()=>{n||(n=new Ps(t,e,u=>{Object.assign(e,u)})),n.show()}),t.on("connected",({isHub:u,user:y})=>{console.log(`[RevealPeerJS] Connected as ${u?"HUB":"VISITOR"} (${y.username})`);const S=document.getElementById("rpjs-status-dot");if(S&&S.classList.remove("rpjs-connecting","rpjs-offline"),u){const R=document.createElement("button");R.id="rpjs-btn-hub",R.className="rpjs-hub-btn",R.title="Hub Controls",R.innerHTML=ys,R.addEventListener("click",()=>{i||(i=new Es(t,r,l)),i.toggle()}),p.appendChild(R)}}),t.on("error",u=>{console.error("[RevealPeerJS] Error:",u);const y=document.getElementById("rpjs-status-dot");y&&y.classList.add("rpjs-offline")}),t.on("user-list",()=>{s&&s.updateUsers()}),t.on("chat",u=>{s&&s.isVisible()&&s.addChatMessage(u)}),t.on("chat-history",()=>{s&&s.updateChat()}),t.on("assigned-name",u=>{e.username=u,Rt(e)}),t.on("jump-slide",u=>{r.slide(u.indexh,u.indexv)}),t.on("follow-mode",({active:u})=>{u&&console.log("[RevealPeerJS] Follow mode enabled")}),t.on("poll-start",u=>{h(u)}),t.on("poll-results",u=>{d(u)}),t.on("pong-invite",u=>{g(u)}),t.on("pong-accept",u=>{u.to===t.myId&&(o=new Mt(t,!0,u.from,c),o.start())}),t.on("arena-start",u=>{t.isHub||(a&&(a.stop(),a=null),a=new ke(t,!1,c),a.start(u))}),r.on("slidechanged",()=>{if(!t.isHub){const u=r.getIndices();t.reportSlideChange(u.h,u.v)}});function h(u){const y=document.createElement("div");y.className="rpjs-poll-vote-overlay",u.timeout;const S=Date.now(),R=u.timeout*1e3;y.innerHTML=`
        <div class="rpjs-poll-vote-card">
          <div class="rpjs-poll-vote-question">${b(u.question)}</div>
          <div class="rpjs-poll-vote-options" id="rpjs-vote-options">
            ${u.answers.map((H,q)=>`
              <button class="rpjs-poll-vote-option" data-index="${q}">${b(H)}</button>
            `).join("")}
          </div>
          <div class="rpjs-poll-timer-bar">
            <div class="rpjs-poll-timer-fill" id="rpjs-timer-fill" style="width:100%"></div>
          </div>
        </div>
      `,document.body.appendChild(y);const Ee=setInterval(()=>{const H=Date.now()-S,q=Math.max(0,1-H/R),re=y.querySelector("#rpjs-timer-fill");re&&(re.style.width=`${q*100}%`),H>=R&&(clearInterval(Ee),y.remove())},50);y.querySelectorAll(".rpjs-poll-vote-option").forEach(H=>{H.addEventListener("click",()=>{const q=parseInt(H.getAttribute("data-index")),re=u.answers[q];t.answerPoll(u.pollId,re),clearInterval(Ee),y.remove()})}),setTimeout(()=>{clearInterval(Ee),y.parentNode&&y.remove()},(u.timeout+1)*1e3)}function d(u){const y=document.createElement("div");y.className="rpjs-modal-overlay",y.innerHTML=`
        <div class="rpjs-modal rpjs-poll-results-card">
          <div class="rpjs-modal-title">
            <span>Poll Results</span>
            <button class="rpjs-modal-close" id="rpjs-vresults-close">&times;</button>
          </div>
          <div style="margin-bottom:12px;font-size:14px;color:rgba(255,255,255,0.7)">${b(u.question)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:12px">${u.totalResponses} response${u.totalResponses!==1?"s":""}</div>
          ${u.answers.map(S=>`
            <div class="rpjs-poll-result-row">
              <div class="rpjs-poll-result-label">
                <span>${b(S.text)}</span>
                <span>${S.count} (${S.percentage}%)</span>
              </div>
              <div class="rpjs-poll-result-bar-bg">
                <div class="rpjs-poll-result-bar-fill" style="width:${S.percentage}%"></div>
              </div>
            </div>
          `).join("")}
        </div>
      `,document.body.appendChild(y),y.querySelector("#rpjs-vresults-close").addEventListener("click",()=>y.remove()),y.addEventListener("click",S=>{S.target===y&&y.remove()}),setTimeout(()=>{y.parentNode&&y.remove()},15e3)}function g(u){const y=document.createElement("div");y.className="rpjs-modal-overlay",y.innerHTML=`
        <div class="rpjs-modal" style="text-align:center">
          <div class="rpjs-modal-title" style="justify-content:center">
            <span>Pong Challenge!</span>
          </div>
          <p style="color:rgba(255,255,255,0.7);margin-bottom:16px">${b(u.fromUsername)} challenges you to a game of Pong!</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button id="rpjs-pong-accept" style="padding:8px 20px;background:rgba(76,175,80,0.5);border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:14px;font-family:inherit">Accept</button>
            <button id="rpjs-pong-decline" style="padding:8px 20px;background:rgba(244,67,54,0.3);border:none;border-radius:8px;color:#ef5350;cursor:pointer;font-size:14px;font-family:inherit">Decline</button>
          </div>
        </div>
      `,document.body.appendChild(y),y.querySelector("#rpjs-pong-accept").addEventListener("click",()=>{y.remove();const S={type:m.PONG_ACCEPT,payload:{from:t.myId,to:u.from,fromUsername:t.myUser.username},timestamp:Date.now()};t.isHub?t._sendToPeer(u.from,S):t._sendToPeer(t.lobbyId,S),o=new Mt(t,!1,u.from,c),o.start()}),y.querySelector("#rpjs-pong-decline").addEventListener("click",()=>{y.remove();const S={type:m.PONG_DECLINE,payload:{from:t.myId,to:u.from},timestamp:Date.now()};t.isHub?t._sendToPeer(u.from,S):t._sendToPeer(t.lobbyId,S)})}function b(u){const y=document.createElement("div");return y.textContent=u,y.innerHTML}e.darkMode&&document.body.classList.add("rpjs-dark-mode"),e.highContrast&&document.body.classList.add("rpjs-high-contrast"),t.connect(e).catch(u=>{console.error("[RevealPeerJS] Failed to connect:",u)}),window.addEventListener("beforeunload",()=>{t.destroy()}),this.destroy=()=>{t.destroy(),s&&s.destroy(),n&&n.destroy(),i&&i.destroy(),o&&o.stop(),a&&a.stop(),p.remove(),gs()}}})});
//# sourceMappingURL=reveal-peerjs.js.map
