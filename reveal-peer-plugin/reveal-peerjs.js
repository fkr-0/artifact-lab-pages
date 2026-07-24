(function(P,T){typeof exports=="object"&&typeof module<"u"?module.exports=T():typeof define=="function"&&define.amd?define(T):(P=typeof globalThis<"u"?globalThis:P||self,P.RevealPeerJS=T())})(this,function(){"use strict";var Tn=Object.defineProperty;var Pn=P=>{throw TypeError(P)};var En=(P,T,O)=>T in P?Tn(P,T,{enumerable:!0,configurable:!0,writable:!0,value:O}):P[T]=O;var Fe=(P,T,O)=>En(P,typeof T!="symbol"?T+"":T,O);var re=(P,T,O)=>T.has(P)?Pn("Cannot add the same private member more than once"):T instanceof WeakSet?T.add(P):T.set(P,O);var ze,Ue,Ne,Be;function P(n,e){for(var t=0;t<e.length;t++){const s=e[t];if(typeof s!="string"&&!Array.isArray(s)){for(const r in s)if(r!=="default"&&!(r in n)){const i=Object.getOwnPropertyDescriptor(s,r);i&&Object.defineProperty(n,r,i.get?i:{enumerable:!0,get:()=>s[r]})}}}return Object.freeze(Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}))}class T{constructor(){this.encoder=new TextEncoder,this._pieces=[],this._parts=[]}append_buffer(e){this.flush(),this._parts.push(e)}append(e){this._pieces.push(e)}flush(){if(this._pieces.length>0){const e=new Uint8Array(this._pieces);this._parts.push(e),this._pieces=[]}}toArrayBuffer(){const e=[];for(const t of this._parts)e.push(t);return O(e).buffer}}function O(n){let e=0;for(const r of n)e+=r.byteLength;const t=new Uint8Array(e);let s=0;for(const r of n){const i=new Uint8Array(r.buffer,r.byteOffset,r.byteLength);t.set(i,s),s+=r.byteLength}return t}function We(n){return new rs(n).unpack()}function qe(n){const e=new is,t=e.pack(n);return t instanceof Promise?t.then(()=>e.getBuffer()):e.getBuffer()}class rs{constructor(e){this.index=0,this.dataBuffer=e,this.dataView=new Uint8Array(this.dataBuffer),this.length=this.dataBuffer.byteLength}unpack(){const e=this.unpack_uint8();if(e<128)return e;if((e^224)<32)return(e^224)-32;let t;if((t=e^160)<=15)return this.unpack_raw(t);if((t=e^176)<=15)return this.unpack_string(t);if((t=e^144)<=15)return this.unpack_array(t);if((t=e^128)<=15)return this.unpack_map(t);switch(e){case 192:return null;case 193:return;case 194:return!1;case 195:return!0;case 202:return this.unpack_float();case 203:return this.unpack_double();case 204:return this.unpack_uint8();case 205:return this.unpack_uint16();case 206:return this.unpack_uint32();case 207:return this.unpack_uint64();case 208:return this.unpack_int8();case 209:return this.unpack_int16();case 210:return this.unpack_int32();case 211:return this.unpack_int64();case 212:return;case 213:return;case 214:return;case 215:return;case 216:return t=this.unpack_uint16(),this.unpack_string(t);case 217:return t=this.unpack_uint32(),this.unpack_string(t);case 218:return t=this.unpack_uint16(),this.unpack_raw(t);case 219:return t=this.unpack_uint32(),this.unpack_raw(t);case 220:return t=this.unpack_uint16(),this.unpack_array(t);case 221:return t=this.unpack_uint32(),this.unpack_array(t);case 222:return t=this.unpack_uint16(),this.unpack_map(t);case 223:return t=this.unpack_uint32(),this.unpack_map(t)}}unpack_uint8(){const e=this.dataView[this.index]&255;return this.index++,e}unpack_uint16(){const e=this.read(2),t=(e[0]&255)*256+(e[1]&255);return this.index+=2,t}unpack_uint32(){const e=this.read(4),t=((e[0]*256+e[1])*256+e[2])*256+e[3];return this.index+=4,t}unpack_uint64(){const e=this.read(8),t=((((((e[0]*256+e[1])*256+e[2])*256+e[3])*256+e[4])*256+e[5])*256+e[6])*256+e[7];return this.index+=8,t}unpack_int8(){const e=this.unpack_uint8();return e<128?e:e-256}unpack_int16(){const e=this.unpack_uint16();return e<32768?e:e-65536}unpack_int32(){const e=this.unpack_uint32();return e<2**31?e:e-2**32}unpack_int64(){const e=this.unpack_uint64();return e<2**63?e:e-2**64}unpack_raw(e){if(this.length<this.index+e)throw new Error(`BinaryPackFailure: index is out of range ${this.index} ${e} ${this.length}`);const t=this.dataBuffer.slice(this.index,this.index+e);return this.index+=e,t}unpack_string(e){const t=this.read(e);let s=0,r="",i,o;for(;s<e;)i=t[s],i<160?(o=i,s++):(i^192)<32?(o=(i&31)<<6|t[s+1]&63,s+=2):(i^224)<16?(o=(i&15)<<12|(t[s+1]&63)<<6|t[s+2]&63,s+=3):(o=(i&7)<<18|(t[s+1]&63)<<12|(t[s+2]&63)<<6|t[s+3]&63,s+=4),r+=String.fromCodePoint(o);return this.index+=e,r}unpack_array(e){const t=new Array(e);for(let s=0;s<e;s++)t[s]=this.unpack();return t}unpack_map(e){const t={};for(let s=0;s<e;s++){const r=this.unpack();t[r]=this.unpack()}return t}unpack_float(){const e=this.unpack_uint32(),t=e>>31,s=(e>>23&255)-127,r=e&8388607|8388608;return(t===0?1:-1)*r*2**(s-23)}unpack_double(){const e=this.unpack_uint32(),t=this.unpack_uint32(),s=e>>31,r=(e>>20&2047)-1023,o=(e&1048575|1048576)*2**(r-20)+t*2**(r-52);return(s===0?1:-1)*o}read(e){const t=this.index;if(t+e<=this.length)return this.dataView.subarray(t,t+e);throw new Error("BinaryPackFailure: read index out of range")}}class is{getBuffer(){return this._bufferBuilder.toArrayBuffer()}pack(e){if(typeof e=="string")this.pack_string(e);else if(typeof e=="number")Math.floor(e)===e?this.pack_integer(e):this.pack_double(e);else if(typeof e=="boolean")e===!0?this._bufferBuilder.append(195):e===!1&&this._bufferBuilder.append(194);else if(e===void 0)this._bufferBuilder.append(192);else if(typeof e=="object")if(e===null)this._bufferBuilder.append(192);else{const t=e.constructor;if(e instanceof Array){const s=this.pack_array(e);if(s instanceof Promise)return s.then(()=>this._bufferBuilder.flush())}else if(e instanceof ArrayBuffer)this.pack_bin(new Uint8Array(e));else if("BYTES_PER_ELEMENT"in e){const s=e;this.pack_bin(new Uint8Array(s.buffer,s.byteOffset,s.byteLength))}else if(e instanceof Date)this.pack_string(e.toString());else{if(e instanceof Blob)return e.arrayBuffer().then(s=>{this.pack_bin(new Uint8Array(s)),this._bufferBuilder.flush()});if(t==Object||t.toString().startsWith("class")){const s=this.pack_object(e);if(s instanceof Promise)return s.then(()=>this._bufferBuilder.flush())}else throw new Error(`Type "${t.toString()}" not yet supported`)}}else throw new Error(`Type "${typeof e}" not yet supported`);this._bufferBuilder.flush()}pack_bin(e){const t=e.length;if(t<=15)this.pack_uint8(160+t);else if(t<=65535)this._bufferBuilder.append(218),this.pack_uint16(t);else if(t<=4294967295)this._bufferBuilder.append(219),this.pack_uint32(t);else throw new Error("Invalid length");this._bufferBuilder.append_buffer(e)}pack_string(e){const t=this._textEncoder.encode(e),s=t.length;if(s<=15)this.pack_uint8(176+s);else if(s<=65535)this._bufferBuilder.append(216),this.pack_uint16(s);else if(s<=4294967295)this._bufferBuilder.append(217),this.pack_uint32(s);else throw new Error("Invalid length");this._bufferBuilder.append_buffer(t)}pack_array(e){const t=e.length;if(t<=15)this.pack_uint8(144+t);else if(t<=65535)this._bufferBuilder.append(220),this.pack_uint16(t);else if(t<=4294967295)this._bufferBuilder.append(221),this.pack_uint32(t);else throw new Error("Invalid length");const s=r=>{if(r<t){const i=this.pack(e[r]);return i instanceof Promise?i.then(()=>s(r+1)):s(r+1)}};return s(0)}pack_integer(e){if(e>=-32&&e<=127)this._bufferBuilder.append(e&255);else if(e>=0&&e<=255)this._bufferBuilder.append(204),this.pack_uint8(e);else if(e>=-128&&e<=127)this._bufferBuilder.append(208),this.pack_int8(e);else if(e>=0&&e<=65535)this._bufferBuilder.append(205),this.pack_uint16(e);else if(e>=-32768&&e<=32767)this._bufferBuilder.append(209),this.pack_int16(e);else if(e>=0&&e<=4294967295)this._bufferBuilder.append(206),this.pack_uint32(e);else if(e>=-2147483648&&e<=2147483647)this._bufferBuilder.append(210),this.pack_int32(e);else if(e>=-9223372036854776e3&&e<=9223372036854776e3)this._bufferBuilder.append(211),this.pack_int64(e);else if(e>=0&&e<=18446744073709552e3)this._bufferBuilder.append(207),this.pack_uint64(e);else throw new Error("Invalid integer")}pack_double(e){let t=0;e<0&&(t=1,e=-e);const s=Math.floor(Math.log(e)/Math.LN2),r=e/2**s-1,i=Math.floor(r*2**52),o=2**32,a=t<<31|s+1023<<20|i/o&1048575,c=i%o;this._bufferBuilder.append(203),this.pack_int32(a),this.pack_int32(c)}pack_object(e){const t=Object.keys(e),s=t.length;if(s<=15)this.pack_uint8(128+s);else if(s<=65535)this._bufferBuilder.append(222),this.pack_uint16(s);else if(s<=4294967295)this._bufferBuilder.append(223),this.pack_uint32(s);else throw new Error("Invalid length");const r=i=>{if(i<t.length){const o=t[i];if(e.hasOwnProperty(o)){this.pack(o);const a=this.pack(e[o]);if(a instanceof Promise)return a.then(()=>r(i+1))}return r(i+1)}};return r(0)}pack_uint8(e){this._bufferBuilder.append(e)}pack_uint16(e){this._bufferBuilder.append(e>>8),this._bufferBuilder.append(e&255)}pack_uint32(e){const t=e&4294967295;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255)}pack_uint64(e){const t=e/4294967296,s=e%2**32;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255),this._bufferBuilder.append((s&4278190080)>>>24),this._bufferBuilder.append((s&16711680)>>>16),this._bufferBuilder.append((s&65280)>>>8),this._bufferBuilder.append(s&255)}pack_int8(e){this._bufferBuilder.append(e&255)}pack_int16(e){this._bufferBuilder.append((e&65280)>>8),this._bufferBuilder.append(e&255)}pack_int32(e){this._bufferBuilder.append(e>>>24&255),this._bufferBuilder.append((e&16711680)>>>16),this._bufferBuilder.append((e&65280)>>>8),this._bufferBuilder.append(e&255)}pack_int64(e){const t=Math.floor(e/4294967296),s=e%2**32;this._bufferBuilder.append((t&4278190080)>>>24),this._bufferBuilder.append((t&16711680)>>>16),this._bufferBuilder.append((t&65280)>>>8),this._bufferBuilder.append(t&255),this._bufferBuilder.append((s&4278190080)>>>24),this._bufferBuilder.append((s&16711680)>>>16),this._bufferBuilder.append((s&65280)>>>8),this._bufferBuilder.append(s&255)}constructor(){this._bufferBuilder=new T,this._textEncoder=new TextEncoder}}let Ye=!0,Ge=!0;function J(n,e,t){const s=n.match(e);return s&&s.length>=t&&parseFloat(s[t],10)}function U(n,e,t){if(!n.RTCPeerConnection)return;if(!Object.getOwnPropertyDescriptor(EventTarget.prototype,"addEventListener").writable){ye("Unable to polyfill events");return}const r=n.RTCPeerConnection.prototype,i=r.addEventListener;r.addEventListener=function(a,c){if(a!==e)return i.apply(this,arguments);const l=p=>{const d=t(p);d&&(c.handleEvent?c.handleEvent(d):c(d))};return this._eventMap=this._eventMap||{},this._eventMap[e]||(this._eventMap[e]=new Map),this._eventMap[e].set(c,l),i.apply(this,[a,l])};const o=r.removeEventListener;r.removeEventListener=function(a,c){if(a!==e||!this._eventMap||!this._eventMap[e])return o.apply(this,arguments);if(!this._eventMap[e].has(c))return o.apply(this,arguments);const l=this._eventMap[e].get(c);return this._eventMap[e].delete(c),this._eventMap[e].size===0&&delete this._eventMap[e],Object.keys(this._eventMap).length===0&&delete this._eventMap,o.apply(this,[a,l])},Object.defineProperty(r,"on"+e,{get(){return this["_on"+e]},set(a){this["_on"+e]&&(this.removeEventListener(e,this["_on"+e]),delete this["_on"+e]),a&&this.addEventListener(e,this["_on"+e]=a)},enumerable:!0,configurable:!0})}function os(n){return typeof n!="boolean"?new Error("Argument type: "+typeof n+". Please use a boolean."):(Ye=n,n?"adapter.js logging disabled":"adapter.js logging enabled")}function as(n){return typeof n!="boolean"?new Error("Argument type: "+typeof n+". Please use a boolean."):(Ge=!n,"adapter.js deprecation warnings "+(n?"disabled":"enabled"))}function ye(){if(typeof window=="object"){if(Ye)return;typeof console<"u"&&typeof console.log=="function"&&console.log.apply(console,arguments)}}function _e(n,e){Ge&&console.warn(n+" is deprecated, please use "+e+" instead.")}function cs(n){const e={browser:null,version:null};if(typeof n>"u"||!n.navigator||!n.navigator.userAgent)return e.browser="Not a browser.",e;const{navigator:t}=n;if(t.userAgentData&&t.userAgentData.brands){const s=t.userAgentData.brands.find(r=>r.brand==="Chromium");if(s)return{browser:"chrome",version:parseInt(s.version,10)}}if(t.mozGetUserMedia)e.browser="firefox",e.version=parseInt(J(t.userAgent,/Firefox\/(\d+)\./,1));else if(t.webkitGetUserMedia||n.isSecureContext===!1&&n.webkitRTCPeerConnection)e.browser="chrome",e.version=parseInt(J(t.userAgent,/Chrom(e|ium)\/(\d+)\./,2))||null;else if(n.RTCPeerConnection&&t.userAgent.match(/AppleWebKit\/(\d+)\./))e.browser="safari",e.version=parseInt(J(t.userAgent,/AppleWebKit\/(\d+)\./,1)),e.supportsUnifiedPlan=n.RTCRtpTransceiver&&"currentDirection"in n.RTCRtpTransceiver.prototype,e._safariVersion=J(t.userAgent,/Version\/(\d+(\.?\d+))/,1);else return e.browser="Not a supported browser.",e;return e}function Ve(n){return Object.prototype.toString.call(n)==="[object Object]"}function Xe(n){return Ve(n)?Object.keys(n).reduce(function(e,t){const s=Ve(n[t]),r=s?Xe(n[t]):n[t],i=s&&!Object.keys(r).length;return r===void 0||i?e:Object.assign(e,{[t]:r})},{}):n}function ve(n,e,t){!e||t.has(e.id)||(t.set(e.id,e),Object.keys(e).forEach(s=>{s.endsWith("Id")?ve(n,n.get(e[s]),t):s.endsWith("Ids")&&e[s].forEach(r=>{ve(n,n.get(r),t)})}))}function Je(n,e,t){const s=t?"outbound-rtp":"inbound-rtp",r=new Map;if(e===null)return r;const i=[];return n.forEach(o=>{o.type==="track"&&o.trackIdentifier===e.id&&i.push(o)}),i.forEach(o=>{n.forEach(a=>{a.type===s&&a.trackId===o.id&&ve(n,a,r)})}),r}const Ke=ye;function Ze(n,e){const t=n&&n.navigator;if(!t.mediaDevices)return;const s=function(a){if(typeof a!="object"||a.mandatory||a.optional)return a;const c={};return Object.keys(a).forEach(l=>{if(l==="require"||l==="advanced"||l==="mediaSource")return;const p=typeof a[l]=="object"?a[l]:{ideal:a[l]};p.exact!==void 0&&typeof p.exact=="number"&&(p.min=p.max=p.exact);const d=function(h,f){return h?h+f.charAt(0).toUpperCase()+f.slice(1):f==="deviceId"?"sourceId":f};if(p.ideal!==void 0){c.optional=c.optional||[];let h={};typeof p.ideal=="number"?(h[d("min",l)]=p.ideal,c.optional.push(h),h={},h[d("max",l)]=p.ideal,c.optional.push(h)):(h[d("",l)]=p.ideal,c.optional.push(h))}p.exact!==void 0&&typeof p.exact!="number"?(c.mandatory=c.mandatory||{},c.mandatory[d("",l)]=p.exact):["min","max"].forEach(h=>{p[h]!==void 0&&(c.mandatory=c.mandatory||{},c.mandatory[d(h,l)]=p[h])})}),a.advanced&&(c.optional=(c.optional||[]).concat(a.advanced)),c},r=function(a,c){if(e.version>=61)return c(a);if(a=JSON.parse(JSON.stringify(a)),a&&typeof a.audio=="object"){const l=function(p,d,h){d in p&&!(h in p)&&(p[h]=p[d],delete p[d])};a=JSON.parse(JSON.stringify(a)),l(a.audio,"autoGainControl","googAutoGainControl"),l(a.audio,"noiseSuppression","googNoiseSuppression"),a.audio=s(a.audio)}if(a&&typeof a.video=="object"){let l=a.video.facingMode;l=l&&(typeof l=="object"?l:{ideal:l});const p=e.version<66;if(l&&(l.exact==="user"||l.exact==="environment"||l.ideal==="user"||l.ideal==="environment")&&!(t.mediaDevices.getSupportedConstraints&&t.mediaDevices.getSupportedConstraints().facingMode&&!p)){delete a.video.facingMode;let d;if(l.exact==="environment"||l.ideal==="environment"?d=["back","rear"]:(l.exact==="user"||l.ideal==="user")&&(d=["front"]),d)return t.mediaDevices.enumerateDevices().then(h=>{h=h.filter(b=>b.kind==="videoinput");let f=h.find(b=>d.some(u=>b.label.toLowerCase().includes(u)));return!f&&h.length&&d.includes("back")&&(f=h[h.length-1]),f&&(a.video.deviceId=l.exact?{exact:f.deviceId}:{ideal:f.deviceId}),a.video=s(a.video),Ke("chrome: "+JSON.stringify(a)),c(a)})}a.video=s(a.video)}return Ke("chrome: "+JSON.stringify(a)),c(a)},i=function(a){return e.version>=64?a:{name:{PermissionDeniedError:"NotAllowedError",PermissionDismissedError:"NotAllowedError",InvalidStateError:"NotAllowedError",DevicesNotFoundError:"NotFoundError",ConstraintNotSatisfiedError:"OverconstrainedError",TrackStartError:"NotReadableError",MediaDeviceFailedDueToShutdown:"NotAllowedError",MediaDeviceKillSwitchOn:"NotAllowedError",TabCaptureError:"AbortError",ScreenCaptureError:"AbortError",DeviceCaptureError:"AbortError"}[a.name]||a.name,message:a.message,constraint:a.constraint||a.constraintName,toString(){return this.name+(this.message&&": ")+this.message}}},o=function(a,c,l){r(a,p=>{t.webkitGetUserMedia(p,c,d=>{l&&l(i(d))})})};if(t.getUserMedia=o.bind(t),t.mediaDevices.getUserMedia){const a=t.mediaDevices.getUserMedia.bind(t.mediaDevices);t.mediaDevices.getUserMedia=function(c){return r(c,l=>a(l).then(p=>{if(l.audio&&!p.getAudioTracks().length||l.video&&!p.getVideoTracks().length)throw p.getTracks().forEach(d=>{d.stop()}),new DOMException("","NotFoundError");return p},p=>Promise.reject(i(p))))}}}function Qe(n){n.MediaStream=n.MediaStream||n.webkitMediaStream}function et(n,e){if(!(e.version>102))if(typeof n=="object"&&n.RTCPeerConnection&&!("ontrack"in n.RTCPeerConnection.prototype)){Object.defineProperty(n.RTCPeerConnection.prototype,"ontrack",{get(){return this._ontrack},set(s){this._ontrack&&this.removeEventListener("track",this._ontrack),this.addEventListener("track",this._ontrack=s)},enumerable:!0,configurable:!0});const t=n.RTCPeerConnection.prototype.setRemoteDescription;n.RTCPeerConnection.prototype.setRemoteDescription=function(){return this._ontrackpoly||(this._ontrackpoly=r=>{r.stream.addEventListener("addtrack",i=>{let o;n.RTCPeerConnection.prototype.getReceivers?o=this.getReceivers().find(c=>c.track&&c.track.id===i.track.id):o={track:i.track};const a=new Event("track");a.track=i.track,a.receiver=o,a.transceiver={receiver:o},a.streams=[r.stream],this.dispatchEvent(a)}),r.stream.getTracks().forEach(i=>{let o;n.RTCPeerConnection.prototype.getReceivers?o=this.getReceivers().find(c=>c.track&&c.track.id===i.id):o={track:i};const a=new Event("track");a.track=i,a.receiver=o,a.transceiver={receiver:o},a.streams=[r.stream],this.dispatchEvent(a)})},this.addEventListener("addstream",this._ontrackpoly)),t.apply(this,arguments)}}else U(n,"track",t=>(t.transceiver||Object.defineProperty(t,"transceiver",{value:{receiver:t.receiver}}),t))}function tt(n){if(typeof n=="object"&&n.RTCPeerConnection&&!("getSenders"in n.RTCPeerConnection.prototype)&&"createDTMFSender"in n.RTCPeerConnection.prototype){const e=function(r,i){return{track:i,get dtmf(){return this._dtmf===void 0&&(i.kind==="audio"?this._dtmf=r.createDTMFSender(i):this._dtmf=null),this._dtmf},_pc:r}};if(!n.RTCPeerConnection.prototype.getSenders){n.RTCPeerConnection.prototype.getSenders=function(){return this._senders=this._senders||[],this._senders.slice()};const r=n.RTCPeerConnection.prototype.addTrack;n.RTCPeerConnection.prototype.addTrack=function(a,c){let l=r.apply(this,arguments);return l||(l=e(this,a),this._senders.push(l)),l};const i=n.RTCPeerConnection.prototype.removeTrack;n.RTCPeerConnection.prototype.removeTrack=function(a){i.apply(this,arguments);const c=this._senders.indexOf(a);c!==-1&&this._senders.splice(c,1)}}const t=n.RTCPeerConnection.prototype.addStream;n.RTCPeerConnection.prototype.addStream=function(i){this._senders=this._senders||[],t.apply(this,[i]),i.getTracks().forEach(o=>{this._senders.push(e(this,o))})};const s=n.RTCPeerConnection.prototype.removeStream;n.RTCPeerConnection.prototype.removeStream=function(i){this._senders=this._senders||[],s.apply(this,[i]),i.getTracks().forEach(o=>{const a=this._senders.find(c=>c.track===o);a&&this._senders.splice(this._senders.indexOf(a),1)})}}else if(typeof n=="object"&&n.RTCPeerConnection&&"getSenders"in n.RTCPeerConnection.prototype&&"createDTMFSender"in n.RTCPeerConnection.prototype&&n.RTCRtpSender&&!("dtmf"in n.RTCRtpSender.prototype)){const e=n.RTCPeerConnection.prototype.getSenders;n.RTCPeerConnection.prototype.getSenders=function(){const s=e.apply(this,[]);return s.forEach(r=>r._pc=this),s},Object.defineProperty(n.RTCRtpSender.prototype,"dtmf",{get(){return this._dtmf===void 0&&(this.track.kind==="audio"?this._dtmf=this._pc.createDTMFSender(this.track):this._dtmf=null),this._dtmf}})}}function st(n,e){if(e.version>=67||!(typeof n=="object"&&n.RTCPeerConnection&&n.RTCRtpSender&&n.RTCRtpReceiver))return;if(!("getStats"in n.RTCRtpSender.prototype)){const s=n.RTCPeerConnection.prototype.getSenders;s&&(n.RTCPeerConnection.prototype.getSenders=function(){const o=s.apply(this,[]);return o.forEach(a=>a._pc=this),o});const r=n.RTCPeerConnection.prototype.addTrack;r&&(n.RTCPeerConnection.prototype.addTrack=function(){const o=r.apply(this,arguments);return o._pc=this,o}),n.RTCRtpSender.prototype.getStats=function(){const o=this;return this._pc.getStats().then(a=>Je(a,o.track,!0))}}if(!("getStats"in n.RTCRtpReceiver.prototype)){const s=n.RTCPeerConnection.prototype.getReceivers;s&&(n.RTCPeerConnection.prototype.getReceivers=function(){const i=s.apply(this,[]);return i.forEach(o=>o._pc=this),i}),U(n,"track",r=>(r.receiver._pc=r.srcElement,r)),n.RTCRtpReceiver.prototype.getStats=function(){const i=this;return this._pc.getStats().then(o=>Je(o,i.track,!1))}}if(!("getStats"in n.RTCRtpSender.prototype&&"getStats"in n.RTCRtpReceiver.prototype))return;const t=n.RTCPeerConnection.prototype.getStats;n.RTCPeerConnection.prototype.getStats=function(){if(arguments.length>0&&arguments[0]instanceof n.MediaStreamTrack){const r=arguments[0];let i,o,a;return this.getSenders().forEach(c=>{c.track===r&&(i?a=!0:i=c)}),this.getReceivers().forEach(c=>(c.track===r&&(o?a=!0:o=c),c.track===r)),a||i&&o?Promise.reject(new DOMException("There are more than one sender or receiver for the track.","InvalidAccessError")):i?i.getStats():o?o.getStats():Promise.reject(new DOMException("There is no sender or receiver for the track.","InvalidAccessError"))}return t.apply(this,arguments)}}function nt(n){n.RTCPeerConnection.prototype.getLocalStreams=function(){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},Object.keys(this._shimmedLocalStreams).map(o=>this._shimmedLocalStreams[o][0])};const e=n.RTCPeerConnection.prototype.addTrack;n.RTCPeerConnection.prototype.addTrack=function(o,a){if(!a)return e.apply(this,arguments);this._shimmedLocalStreams=this._shimmedLocalStreams||{};const c=e.apply(this,arguments);return this._shimmedLocalStreams[a.id]?this._shimmedLocalStreams[a.id].indexOf(c)===-1&&this._shimmedLocalStreams[a.id].push(c):this._shimmedLocalStreams[a.id]=[a,c],c};const t=n.RTCPeerConnection.prototype.addStream;n.RTCPeerConnection.prototype.addStream=function(o){this._shimmedLocalStreams=this._shimmedLocalStreams||{},o.getTracks().forEach(l=>{if(this.getSenders().find(d=>d.track===l))throw new DOMException("Track already exists.","InvalidAccessError")});const a=this.getSenders();t.apply(this,arguments);const c=this.getSenders().filter(l=>a.indexOf(l)===-1);this._shimmedLocalStreams[o.id]=[o].concat(c)};const s=n.RTCPeerConnection.prototype.removeStream;n.RTCPeerConnection.prototype.removeStream=function(o){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},delete this._shimmedLocalStreams[o.id],s.apply(this,arguments)};const r=n.RTCPeerConnection.prototype.removeTrack;n.RTCPeerConnection.prototype.removeTrack=function(o){return this._shimmedLocalStreams=this._shimmedLocalStreams||{},o&&Object.keys(this._shimmedLocalStreams).forEach(a=>{const c=this._shimmedLocalStreams[a].indexOf(o);c!==-1&&this._shimmedLocalStreams[a].splice(c,1),this._shimmedLocalStreams[a].length===1&&delete this._shimmedLocalStreams[a]}),r.apply(this,arguments)}}function rt(n,e){if(!n.RTCPeerConnection)return;if(n.RTCPeerConnection.prototype.addTrack&&e.version>=65)return nt(n);const t=n.RTCPeerConnection.prototype.getLocalStreams;n.RTCPeerConnection.prototype.getLocalStreams=function(){const p=t.apply(this);return this._reverseStreams=this._reverseStreams||{},p.map(d=>this._reverseStreams[d.id])};const s=n.RTCPeerConnection.prototype.addStream;n.RTCPeerConnection.prototype.addStream=function(p){if(this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},p.getTracks().forEach(d=>{if(this.getSenders().find(f=>f.track===d))throw new DOMException("Track already exists.","InvalidAccessError")}),!this._reverseStreams[p.id]){const d=new n.MediaStream(p.getTracks());this._streams[p.id]=d,this._reverseStreams[d.id]=p,p=d}s.apply(this,[p])};const r=n.RTCPeerConnection.prototype.removeStream;n.RTCPeerConnection.prototype.removeStream=function(p){this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{},r.apply(this,[this._streams[p.id]||p]),delete this._reverseStreams[this._streams[p.id]?this._streams[p.id].id:p.id],delete this._streams[p.id]},n.RTCPeerConnection.prototype.addTrack=function(p,d){if(this.signalingState==="closed")throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");const h=[].slice.call(arguments,1);if(h.length!==1||!h[0].getTracks().find(u=>u===p))throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.","NotSupportedError");if(this.getSenders().find(u=>u.track===p))throw new DOMException("Track already exists.","InvalidAccessError");this._streams=this._streams||{},this._reverseStreams=this._reverseStreams||{};const b=this._streams[d.id];if(b)b.addTrack(p),Promise.resolve().then(()=>{this.dispatchEvent(new Event("negotiationneeded"))});else{const u=new n.MediaStream([p]);this._streams[d.id]=u,this._reverseStreams[u.id]=d,this.addStream(u)}return this.getSenders().find(u=>u.track===p)};function i(l,p){let d=p.sdp;return Object.keys(l._reverseStreams||[]).forEach(h=>{const f=l._reverseStreams[h],b=l._streams[f.id];d=d.replace(new RegExp(b.id,"g"),f.id)}),new RTCSessionDescription({type:p.type,sdp:d})}function o(l,p){let d=p.sdp;return Object.keys(l._reverseStreams||[]).forEach(h=>{const f=l._reverseStreams[h],b=l._streams[f.id];d=d.replace(new RegExp(f.id,"g"),b.id)}),new RTCSessionDescription({type:p.type,sdp:d})}["createOffer","createAnswer"].forEach(function(l){const p=n.RTCPeerConnection.prototype[l],d={[l](){const h=arguments;return arguments.length&&typeof arguments[0]=="function"?p.apply(this,[b=>{const u=i(this,b);h[0].apply(null,[u])},b=>{h[1]&&h[1].apply(null,b)},arguments[2]]):p.apply(this,arguments).then(b=>i(this,b))}};n.RTCPeerConnection.prototype[l]=d[l]});const a=n.RTCPeerConnection.prototype.setLocalDescription;n.RTCPeerConnection.prototype.setLocalDescription=function(){return!arguments.length||!arguments[0].type?a.apply(this,arguments):(arguments[0]=o(this,arguments[0]),a.apply(this,arguments))};const c=Object.getOwnPropertyDescriptor(n.RTCPeerConnection.prototype,"localDescription");Object.defineProperty(n.RTCPeerConnection.prototype,"localDescription",{get(){const l=c.get.apply(this);return l.type===""?l:i(this,l)}}),n.RTCPeerConnection.prototype.removeTrack=function(p){if(this.signalingState==="closed")throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.","InvalidStateError");if(!p._pc)throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.","TypeError");if(!(p._pc===this))throw new DOMException("Sender was not created by this connection.","InvalidAccessError");this._streams=this._streams||{};let h;Object.keys(this._streams).forEach(f=>{this._streams[f].getTracks().find(u=>p.track===u)&&(h=this._streams[f])}),h&&(h.getTracks().length===1?this.removeStream(this._reverseStreams[h.id]):h.removeTrack(p.track),this.dispatchEvent(new Event("negotiationneeded")))}}function xe(n,e){!n.RTCPeerConnection&&n.webkitRTCPeerConnection&&(n.RTCPeerConnection=n.webkitRTCPeerConnection),n.RTCPeerConnection&&e.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){const s=n.RTCPeerConnection.prototype[t],r={[t](){return arguments[0]=new(t==="addIceCandidate"?n.RTCIceCandidate:n.RTCSessionDescription)(arguments[0]),s.apply(this,arguments)}};n.RTCPeerConnection.prototype[t]=r[t]})}function it(n,e){e.version>102||U(n,"negotiationneeded",t=>{const s=t.target;if(!((e.version<72||s.getConfiguration&&s.getConfiguration().sdpSemantics==="plan-b")&&s.signalingState!=="stable"))return t})}const ot=Object.freeze(Object.defineProperty({__proto__:null,fixNegotiationNeeded:it,shimAddTrackRemoveTrack:rt,shimAddTrackRemoveTrackWithNative:nt,shimGetSendersWithDtmf:tt,shimGetUserMedia:Ze,shimMediaStream:Qe,shimOnTrack:et,shimPeerConnection:xe,shimSenderReceiverGetStats:st},Symbol.toStringTag,{value:"Module"}));function at(n,e){const t=n&&n.navigator,s=n&&n.MediaStreamTrack;if(t.getUserMedia=function(r,i,o){_e("navigator.getUserMedia","navigator.mediaDevices.getUserMedia"),t.mediaDevices.getUserMedia(r).then(i,o)},!(e.version>55&&"autoGainControl"in t.mediaDevices.getSupportedConstraints())){const r=function(o,a,c){a in o&&!(c in o)&&(o[c]=o[a],delete o[a])},i=t.mediaDevices.getUserMedia.bind(t.mediaDevices);if(t.mediaDevices.getUserMedia=function(o){return typeof o=="object"&&typeof o.audio=="object"&&(o=JSON.parse(JSON.stringify(o)),r(o.audio,"autoGainControl","mozAutoGainControl"),r(o.audio,"noiseSuppression","mozNoiseSuppression")),i(o)},s&&s.prototype.getSettings){const o=s.prototype.getSettings;s.prototype.getSettings=function(){const a=o.apply(this,arguments);return r(a,"mozAutoGainControl","autoGainControl"),r(a,"mozNoiseSuppression","noiseSuppression"),a}}if(s&&s.prototype.applyConstraints){const o=s.prototype.applyConstraints;s.prototype.applyConstraints=function(a){return this.kind==="audio"&&typeof a=="object"&&(a=JSON.parse(JSON.stringify(a)),r(a,"autoGainControl","mozAutoGainControl"),r(a,"noiseSuppression","mozNoiseSuppression")),o.apply(this,[a])}}}}function ls(n,e){n.navigator.mediaDevices&&"getDisplayMedia"in n.navigator.mediaDevices||n.navigator.mediaDevices&&(n.navigator.mediaDevices.getDisplayMedia=function(s){if(!(s&&s.video)){const r=new DOMException("getDisplayMedia without video constraints is undefined");return r.name="NotFoundError",r.code=8,Promise.reject(r)}return s.video===!0?s.video={mediaSource:e}:s.video.mediaSource=e,n.navigator.mediaDevices.getUserMedia(s)})}function ct(n){typeof n=="object"&&n.RTCTrackEvent&&"receiver"in n.RTCTrackEvent.prototype&&!("transceiver"in n.RTCTrackEvent.prototype)&&Object.defineProperty(n.RTCTrackEvent.prototype,"transceiver",{get(){return{receiver:this.receiver}}})}function ke(n,e){typeof n!="object"||!(n.RTCPeerConnection||n.mozRTCPeerConnection)||(!n.RTCPeerConnection&&n.mozRTCPeerConnection&&(n.RTCPeerConnection=n.mozRTCPeerConnection),e.version<53&&["setLocalDescription","setRemoteDescription","addIceCandidate"].forEach(function(t){const s=n.RTCPeerConnection.prototype[t],r={[t](){return arguments[0]=new(t==="addIceCandidate"?n.RTCIceCandidate:n.RTCSessionDescription)(arguments[0]),s.apply(this,arguments)}};n.RTCPeerConnection.prototype[t]=r[t]}))}function lt(n,e){if(typeof n!="object"||!(n.RTCPeerConnection||n.mozRTCPeerConnection)||e.version>=151)return;const t={inboundrtp:"inbound-rtp",outboundrtp:"outbound-rtp",candidatepair:"candidate-pair",localcandidate:"local-candidate",remotecandidate:"remote-candidate"},s=n.RTCPeerConnection.prototype.getStats;n.RTCPeerConnection.prototype.getStats=function(){const[i,o,a]=arguments;return this.signalingState==="closed"?Promise.resolve(new Map):s.apply(this,[i||null]).then(c=>{if(e.version<53&&!o)try{c.forEach(l=>{l.type=t[l.type]||l.type})}catch(l){if(l.name!=="TypeError")throw l;c.forEach((p,d)=>{c.set(d,Object.assign({},p,{type:t[p.type]||p.type}))})}return c}).then(o,a)}}function pt(n){if(!(typeof n=="object"&&n.RTCPeerConnection&&n.RTCRtpSender)||n.RTCRtpSender&&"getStats"in n.RTCRtpSender.prototype)return;const e=n.RTCPeerConnection.prototype.getSenders;e&&(n.RTCPeerConnection.prototype.getSenders=function(){const r=e.apply(this,[]);return r.forEach(i=>i._pc=this),r});const t=n.RTCPeerConnection.prototype.addTrack;t&&(n.RTCPeerConnection.prototype.addTrack=function(){const r=t.apply(this,arguments);return r._pc=this,r}),n.RTCRtpSender.prototype.getStats=function(){return this.track?this._pc.getStats(this.track):Promise.resolve(new Map)}}function dt(n){if(!(typeof n=="object"&&n.RTCPeerConnection&&n.RTCRtpSender)||n.RTCRtpSender&&"getStats"in n.RTCRtpReceiver.prototype)return;const e=n.RTCPeerConnection.prototype.getReceivers;e&&(n.RTCPeerConnection.prototype.getReceivers=function(){const s=e.apply(this,[]);return s.forEach(r=>r._pc=this),s}),U(n,"track",t=>(t.receiver._pc=t.srcElement,t)),n.RTCRtpReceiver.prototype.getStats=function(){return this._pc.getStats(this.track)}}function ht(n){!n.RTCPeerConnection||"removeStream"in n.RTCPeerConnection.prototype||(n.RTCPeerConnection.prototype.removeStream=function(t){_e("removeStream","removeTrack"),this.getSenders().forEach(s=>{s.track&&t.getTracks().includes(s.track)&&this.removeTrack(s)})})}function ut(n){n.DataChannel&&!n.RTCDataChannel&&(n.RTCDataChannel=n.DataChannel)}function ft(n){if(!(typeof n=="object"&&n.RTCPeerConnection))return;const e=n.RTCPeerConnection.prototype.addTransceiver;e&&(n.RTCPeerConnection.prototype.addTransceiver=function(){this.setParametersPromises=[];let s=arguments[1]&&arguments[1].sendEncodings;s===void 0&&(s=[]),s=[...s];const r=s.length>0;r&&s.forEach(o=>{if("rid"in o&&!/^[a-z0-9]{0,16}$/i.test(o.rid))throw new TypeError("Invalid RID value provided.");if("scaleResolutionDownBy"in o&&!(parseFloat(o.scaleResolutionDownBy)>=1))throw new RangeError("scale_resolution_down_by must be >= 1.0");if("maxFramerate"in o&&!(parseFloat(o.maxFramerate)>=0))throw new RangeError("max_framerate must be >= 0.0")});const i=e.apply(this,arguments);if(r){const{sender:o}=i,a=o.getParameters();(!("encodings"in a)||a.encodings.length===1&&Object.keys(a.encodings[0]).length===0)&&(a.encodings=s,o.sendEncodings=s,this.setParametersPromises.push(o.setParameters(a).then(()=>{delete o.sendEncodings}).catch(()=>{delete o.sendEncodings})))}return i})}function mt(n){if(!(typeof n=="object"&&n.RTCRtpSender))return;const e=n.RTCRtpSender.prototype.getParameters;e&&(n.RTCRtpSender.prototype.getParameters=function(){const s=e.apply(this,arguments);return"encodings"in s||(s.encodings=[].concat(this.sendEncodings||[{}])),s})}function gt(n){if(!(typeof n=="object"&&n.RTCPeerConnection))return;const e=n.RTCPeerConnection.prototype.createOffer;n.RTCPeerConnection.prototype.createOffer=function(){return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(()=>e.apply(this,arguments)).finally(()=>{this.setParametersPromises=[]}):e.apply(this,arguments)}}function bt(n){if(!(typeof n=="object"&&n.RTCPeerConnection))return;const e=n.RTCPeerConnection.prototype.createAnswer;n.RTCPeerConnection.prototype.createAnswer=function(){return this.setParametersPromises&&this.setParametersPromises.length?Promise.all(this.setParametersPromises).then(()=>e.apply(this,arguments)).finally(()=>{this.setParametersPromises=[]}):e.apply(this,arguments)}}const yt=Object.freeze(Object.defineProperty({__proto__:null,shimAddTransceiver:ft,shimCreateAnswer:bt,shimCreateOffer:gt,shimGetDisplayMedia:ls,shimGetParameters:mt,shimGetStats:lt,shimGetUserMedia:at,shimOnTrack:ct,shimPeerConnection:ke,shimRTCDataChannel:ut,shimReceiverGetStats:dt,shimRemoveStream:ht,shimSenderGetStats:pt},Symbol.toStringTag,{value:"Module"}));function _t(n){if(!(typeof n!="object"||!n.RTCPeerConnection)){if("getLocalStreams"in n.RTCPeerConnection.prototype||(n.RTCPeerConnection.prototype.getLocalStreams=function(){return this._localStreams||(this._localStreams=[]),this._localStreams}),!("addStream"in n.RTCPeerConnection.prototype)){const e=n.RTCPeerConnection.prototype.addTrack;n.RTCPeerConnection.prototype.addStream=function(s){this._localStreams||(this._localStreams=[]),this._localStreams.includes(s)||this._localStreams.push(s),s.getAudioTracks().forEach(r=>e.call(this,r,s)),s.getVideoTracks().forEach(r=>e.call(this,r,s))},n.RTCPeerConnection.prototype.addTrack=function(s,...r){return r&&r.forEach(i=>{this._localStreams?this._localStreams.includes(i)||this._localStreams.push(i):this._localStreams=[i]}),e.apply(this,arguments)}}"removeStream"in n.RTCPeerConnection.prototype||(n.RTCPeerConnection.prototype.removeStream=function(t){this._localStreams||(this._localStreams=[]);const s=this._localStreams.indexOf(t);if(s===-1)return;this._localStreams.splice(s,1);const r=t.getTracks();this.getSenders().forEach(i=>{r.includes(i.track)&&this.removeTrack(i)})})}}function vt(n){if(!(typeof n!="object"||!n.RTCPeerConnection)&&("getRemoteStreams"in n.RTCPeerConnection.prototype||(n.RTCPeerConnection.prototype.getRemoteStreams=function(){return this._remoteStreams?this._remoteStreams:[]}),!("onaddstream"in n.RTCPeerConnection.prototype))){Object.defineProperty(n.RTCPeerConnection.prototype,"onaddstream",{get(){return this._onaddstream},set(t){this._onaddstream&&(this.removeEventListener("addstream",this._onaddstream),this.removeEventListener("track",this._onaddstreampoly)),this.addEventListener("addstream",this._onaddstream=t),this.addEventListener("track",this._onaddstreampoly=s=>{s.streams.forEach(r=>{if(this._remoteStreams||(this._remoteStreams=[]),this._remoteStreams.includes(r))return;this._remoteStreams.push(r);const i=new Event("addstream");i.stream=r,this.dispatchEvent(i)})})}});const e=n.RTCPeerConnection.prototype.setRemoteDescription;n.RTCPeerConnection.prototype.setRemoteDescription=function(){const s=this;return this._onaddstreampoly||this.addEventListener("track",this._onaddstreampoly=function(r){r.streams.forEach(i=>{if(s._remoteStreams||(s._remoteStreams=[]),s._remoteStreams.indexOf(i)>=0)return;s._remoteStreams.push(i);const o=new Event("addstream");o.stream=i,s.dispatchEvent(o)})}),e.apply(s,arguments)}}}function xt(n){if(typeof n!="object"||!n.RTCPeerConnection)return;const e=n.RTCPeerConnection.prototype,t=e.createOffer,s=e.createAnswer,r=e.setLocalDescription,i=e.setRemoteDescription,o=e.addIceCandidate;e.createOffer=function(l,p){const d=arguments.length>=2?arguments[2]:arguments[0],h=t.apply(this,[d]);return p?(h.then(l,p),Promise.resolve()):h},e.createAnswer=function(l,p){const d=arguments.length>=2?arguments[2]:arguments[0],h=s.apply(this,[d]);return p?(h.then(l,p),Promise.resolve()):h};let a=function(c,l,p){const d=r.apply(this,[c]);return p?(d.then(l,p),Promise.resolve()):d};e.setLocalDescription=a,a=function(c,l,p){const d=i.apply(this,[c]);return p?(d.then(l,p),Promise.resolve()):d},e.setRemoteDescription=a,a=function(c,l,p){const d=o.apply(this,[c]);return p?(d.then(l,p),Promise.resolve()):d},e.addIceCandidate=a}function kt(n){const e=n&&n.navigator;if(e.mediaDevices&&e.mediaDevices.getUserMedia){const t=e.mediaDevices,s=t.getUserMedia.bind(t);e.mediaDevices.getUserMedia=r=>s(St(r))}!e.getUserMedia&&e.mediaDevices&&e.mediaDevices.getUserMedia&&(e.getUserMedia=(function(s,r,i){e.mediaDevices.getUserMedia(s).then(r,i)}).bind(e))}function St(n){return n&&n.video!==void 0?Object.assign({},n,{video:Xe(n.video)}):n}function Ct(n){if(!n.RTCPeerConnection)return;const e=n.RTCPeerConnection;n.RTCPeerConnection=function(s,r){if(s&&s.iceServers){const i=[];for(let o=0;o<s.iceServers.length;o++){let a=s.iceServers[o];a.urls===void 0&&a.url?(_e("RTCIceServer.url","RTCIceServer.urls"),a=JSON.parse(JSON.stringify(a)),a.urls=a.url,delete a.url,i.push(a)):i.push(s.iceServers[o])}s.iceServers=i}return new e(s,r)},n.RTCPeerConnection.prototype=e.prototype,"generateCertificate"in e&&Object.defineProperty(n.RTCPeerConnection,"generateCertificate",{get(){return e.generateCertificate}})}function jt(n){typeof n=="object"&&n.RTCTrackEvent&&"receiver"in n.RTCTrackEvent.prototype&&!("transceiver"in n.RTCTrackEvent.prototype)&&Object.defineProperty(n.RTCTrackEvent.prototype,"transceiver",{get(){return{receiver:this.receiver}}})}function Tt(n){const e=n.RTCPeerConnection.prototype.createOffer;n.RTCPeerConnection.prototype.createOffer=function(s){if(s){typeof s.offerToReceiveAudio<"u"&&(s.offerToReceiveAudio=!!s.offerToReceiveAudio);const r=this.getTransceivers().find(o=>o.receiver.track.kind==="audio");s.offerToReceiveAudio===!1&&r?r.direction==="sendrecv"?r.setDirection?r.setDirection("sendonly"):r.direction="sendonly":r.direction==="recvonly"&&(r.setDirection?r.setDirection("inactive"):r.direction="inactive"):s.offerToReceiveAudio===!0&&!r&&this.addTransceiver("audio",{direction:"recvonly"}),typeof s.offerToReceiveVideo<"u"&&(s.offerToReceiveVideo=!!s.offerToReceiveVideo);const i=this.getTransceivers().find(o=>o.receiver.track.kind==="video");s.offerToReceiveVideo===!1&&i?i.direction==="sendrecv"?i.setDirection?i.setDirection("sendonly"):i.direction="sendonly":i.direction==="recvonly"&&(i.setDirection?i.setDirection("inactive"):i.direction="inactive"):s.offerToReceiveVideo===!0&&!i&&this.addTransceiver("video",{direction:"recvonly"})}return e.apply(this,arguments)}}function Pt(n){typeof n!="object"||n.AudioContext||(n.AudioContext=n.webkitAudioContext)}const Et=Object.freeze(Object.defineProperty({__proto__:null,shimAudioContext:Pt,shimCallbacksAPI:xt,shimConstraints:St,shimCreateOfferLegacy:Tt,shimGetUserMedia:kt,shimLocalStreamsAPI:_t,shimRTCIceServerUrls:Ct,shimRemoteStreamsAPI:vt,shimTrackEventTransceiver:jt},Symbol.toStringTag,{value:"Module"}));function ps(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Rt={exports:{}};(function(n){const e={};e.generateIdentifier=function(){return Math.random().toString(36).substring(2,12)},e.localCName=e.generateIdentifier(),e.splitLines=function(t){return t.trim().split(`
`).map(s=>s.trim())},e.splitSections=function(t){return t.split(`
m=`).map((r,i)=>(i>0?"m="+r:r).trim()+`\r
`)},e.getDescription=function(t){const s=e.splitSections(t);return s&&s[0]},e.getMediaSections=function(t){const s=e.splitSections(t);return s.shift(),s},e.matchPrefix=function(t,s){return e.splitLines(t).filter(r=>r.indexOf(s)===0)},e.parseCandidate=function(t){let s;t.indexOf("a=candidate:")===0?s=t.substring(12).split(" "):s=t.substring(10).split(" ");const r={foundation:s[0],component:{1:"rtp",2:"rtcp"}[s[1]]||s[1],protocol:s[2].toLowerCase(),priority:parseInt(s[3],10),ip:s[4],address:s[4],port:parseInt(s[5],10),type:s[7]};for(let i=8;i<s.length;i+=2)switch(s[i]){case"raddr":r.relatedAddress=s[i+1];break;case"rport":r.relatedPort=parseInt(s[i+1],10);break;case"tcptype":r.tcpType=s[i+1];break;case"ufrag":r.ufrag=s[i+1],r.usernameFragment=s[i+1];break;default:r[s[i]]===void 0&&(r[s[i]]=s[i+1]);break}return r},e.writeCandidate=function(t){const s=[];s.push(t.foundation);const r=t.component;r==="rtp"?s.push(1):r==="rtcp"?s.push(2):s.push(r),s.push(t.protocol.toUpperCase()),s.push(t.priority),s.push(t.address||t.ip),s.push(t.port);const i=t.type;return s.push("typ"),s.push(i),i!=="host"&&t.relatedAddress&&t.relatedPort!==void 0&&(s.push("raddr"),s.push(t.relatedAddress),s.push("rport"),s.push(t.relatedPort)),t.tcpType&&t.protocol.toLowerCase()==="tcp"&&(s.push("tcptype"),s.push(t.tcpType)),(t.usernameFragment||t.ufrag)&&(s.push("ufrag"),s.push(t.usernameFragment||t.ufrag)),"candidate:"+s.join(" ")},e.parseIceOptions=function(t){return t.substring(14).split(" ")},e.parseRtpMap=function(t){let s=t.substring(9).split(" ");const r={payloadType:parseInt(s.shift(),10)};return s=s[0].split("/"),r.name=s[0],r.clockRate=parseInt(s[1],10),r.channels=s.length===3?parseInt(s[2],10):1,r.numChannels=r.channels,r},e.writeRtpMap=function(t){let s=t.payloadType;t.preferredPayloadType!==void 0&&(s=t.preferredPayloadType);const r=t.channels||t.numChannels||1;return"a=rtpmap:"+s+" "+t.name+"/"+t.clockRate+(r!==1?"/"+r:"")+`\r
`},e.parseExtmap=function(t){const s=t.substring(9).split(" ");return{id:parseInt(s[0],10),direction:s[0].indexOf("/")>0?s[0].split("/")[1]:"sendrecv",uri:s[1],attributes:s.slice(2).join(" ")}},e.writeExtmap=function(t){return"a=extmap:"+(t.id||t.preferredId)+(t.direction&&t.direction!=="sendrecv"?"/"+t.direction:"")+" "+t.uri+(t.attributes?" "+t.attributes:"")+`\r
`},e.parseFmtp=function(t){const s={};let r;const i=t.substring(t.indexOf(" ")+1).split(";");for(let o=0;o<i.length;o++)r=i[o].trim().split("="),s[r[0].trim()]=r[1];return s},e.writeFmtp=function(t){let s="",r=t.payloadType;if(t.preferredPayloadType!==void 0&&(r=t.preferredPayloadType),t.parameters&&Object.keys(t.parameters).length){const i=[];Object.keys(t.parameters).forEach(o=>{t.parameters[o]!==void 0?i.push(o+"="+t.parameters[o]):i.push(o)}),s+="a=fmtp:"+r+" "+i.join(";")+`\r
`}return s},e.parseRtcpFb=function(t){const s=t.substring(t.indexOf(" ")+1).split(" ");return{type:s.shift(),parameter:s.join(" ")}},e.writeRtcpFb=function(t){let s="",r=t.payloadType;return t.preferredPayloadType!==void 0&&(r=t.preferredPayloadType),t.rtcpFeedback&&t.rtcpFeedback.length&&t.rtcpFeedback.forEach(i=>{s+="a=rtcp-fb:"+r+" "+i.type+(i.parameter&&i.parameter.length?" "+i.parameter:"")+`\r
`}),s},e.parseSsrcMedia=function(t){const s=t.indexOf(" "),r={ssrc:parseInt(t.substring(7,s),10)},i=t.indexOf(":",s);return i>-1?(r.attribute=t.substring(s+1,i),r.value=t.substring(i+1)):r.attribute=t.substring(s+1),r},e.parseSsrcGroup=function(t){const s=t.substring(13).split(" ");return{semantics:s.shift(),ssrcs:s.map(r=>parseInt(r,10))}},e.getMid=function(t){const s=e.matchPrefix(t,"a=mid:")[0];if(s)return s.substring(6)},e.parseFingerprint=function(t){const s=t.substring(14).split(" ");return{algorithm:s[0].toLowerCase(),value:s[1].toUpperCase()}},e.getDtlsParameters=function(t,s){return{role:"auto",fingerprints:e.matchPrefix(t+s,"a=fingerprint:").map(e.parseFingerprint)}},e.writeDtlsParameters=function(t,s){let r="a=setup:"+s+`\r
`;return t.fingerprints.forEach(i=>{r+="a=fingerprint:"+i.algorithm+" "+i.value+`\r
`}),r},e.parseCryptoLine=function(t){const s=t.substring(9).split(" ");return{tag:parseInt(s[0],10),cryptoSuite:s[1],keyParams:s[2],sessionParams:s.slice(3)}},e.writeCryptoLine=function(t){return"a=crypto:"+t.tag+" "+t.cryptoSuite+" "+(typeof t.keyParams=="object"?e.writeCryptoKeyParams(t.keyParams):t.keyParams)+(t.sessionParams?" "+t.sessionParams.join(" "):"")+`\r
`},e.parseCryptoKeyParams=function(t){if(t.indexOf("inline:")!==0)return null;const s=t.substring(7).split("|");return{keyMethod:"inline",keySalt:s[0],lifeTime:s[1],mkiValue:s[2]?s[2].split(":")[0]:void 0,mkiLength:s[2]?s[2].split(":")[1]:void 0}},e.writeCryptoKeyParams=function(t){return t.keyMethod+":"+t.keySalt+(t.lifeTime?"|"+t.lifeTime:"")+(t.mkiValue&&t.mkiLength?"|"+t.mkiValue+":"+t.mkiLength:"")},e.getCryptoParameters=function(t,s){return e.matchPrefix(t+s,"a=crypto:").map(e.parseCryptoLine)},e.getIceParameters=function(t,s){const r=e.matchPrefix(t+s,"a=ice-ufrag:")[0],i=e.matchPrefix(t+s,"a=ice-pwd:")[0];return r&&i?{usernameFragment:r.substring(12),password:i.substring(10)}:null},e.writeIceParameters=function(t){let s="a=ice-ufrag:"+t.usernameFragment+`\r
a=ice-pwd:`+t.password+`\r
`;return t.iceLite&&(s+=`a=ice-lite\r
`),s},e.parseRtpParameters=function(t){const s={codecs:[],headerExtensions:[],fecMechanisms:[],rtcp:[]},i=e.splitLines(t)[0].split(" ");s.profile=i[2];for(let a=3;a<i.length;a++){const c=i[a],l=e.matchPrefix(t,"a=rtpmap:"+c+" ")[0];if(l){const p=e.parseRtpMap(l),d=e.matchPrefix(t,"a=fmtp:"+c+" ");switch(p.parameters=d.length?e.parseFmtp(d[0]):{},p.rtcpFeedback=e.matchPrefix(t,"a=rtcp-fb:"+c+" ").map(e.parseRtcpFb),s.codecs.push(p),p.name.toUpperCase()){case"RED":case"ULPFEC":s.fecMechanisms.push(p.name.toUpperCase());break}}}e.matchPrefix(t,"a=extmap:").forEach(a=>{s.headerExtensions.push(e.parseExtmap(a))});const o=e.matchPrefix(t,"a=rtcp-fb:* ").map(e.parseRtcpFb);return s.codecs.forEach(a=>{o.forEach(c=>{a.rtcpFeedback.find(p=>p.type===c.type&&p.parameter===c.parameter)||a.rtcpFeedback.push(c)})}),s},e.writeRtpDescription=function(t,s){let r="";r+="m="+t+" ",r+=s.codecs.length>0?"9":"0",r+=" "+(s.profile||"UDP/TLS/RTP/SAVPF")+" ",r+=s.codecs.map(o=>o.preferredPayloadType!==void 0?o.preferredPayloadType:o.payloadType).join(" ")+`\r
`,r+=`c=IN IP4 0.0.0.0\r
`,r+=`a=rtcp:9 IN IP4 0.0.0.0\r
`,s.codecs.forEach(o=>{r+=e.writeRtpMap(o),r+=e.writeFmtp(o),r+=e.writeRtcpFb(o)});let i=0;return s.codecs.forEach(o=>{o.maxptime>i&&(i=o.maxptime)}),i>0&&(r+="a=maxptime:"+i+`\r
`),s.headerExtensions&&s.headerExtensions.forEach(o=>{r+=e.writeExtmap(o)}),r},e.parseRtpEncodingParameters=function(t){const s=[],r=e.parseRtpParameters(t),i=r.fecMechanisms.indexOf("RED")!==-1,o=r.fecMechanisms.indexOf("ULPFEC")!==-1,a=e.matchPrefix(t,"a=ssrc:").map(h=>e.parseSsrcMedia(h)).filter(h=>h.attribute==="cname"),c=a.length>0&&a[0].ssrc;let l;const p=e.matchPrefix(t,"a=ssrc-group:FID").map(h=>h.substring(17).split(" ").map(b=>parseInt(b,10)));p.length>0&&p[0].length>1&&p[0][0]===c&&(l=p[0][1]),r.codecs.forEach(h=>{if(h.name.toUpperCase()==="RTX"&&h.parameters.apt){let f={ssrc:c,codecPayloadType:parseInt(h.parameters.apt,10)};c&&l&&(f.rtx={ssrc:l}),s.push(f),i&&(f=JSON.parse(JSON.stringify(f)),f.fec={ssrc:c,mechanism:o?"red+ulpfec":"red"},s.push(f))}}),s.length===0&&c&&s.push({ssrc:c});let d=e.matchPrefix(t,"b=");return d.length&&(d[0].indexOf("b=TIAS:")===0?d=parseInt(d[0].substring(7),10):d[0].indexOf("b=AS:")===0?d=parseInt(d[0].substring(5),10)*1e3*.95-50*40*8:d=void 0,s.forEach(h=>{h.maxBitrate=d})),s},e.parseRtcpParameters=function(t){const s={},r=e.matchPrefix(t,"a=ssrc:").map(a=>e.parseSsrcMedia(a)).filter(a=>a.attribute==="cname")[0];r&&(s.cname=r.value,s.ssrc=r.ssrc);const i=e.matchPrefix(t,"a=rtcp-rsize");s.reducedSize=i.length>0,s.compound=i.length===0;const o=e.matchPrefix(t,"a=rtcp-mux");return s.mux=o.length>0,s},e.writeRtcpParameters=function(t){let s="";return t.reducedSize&&(s+=`a=rtcp-rsize\r
`),t.mux&&(s+=`a=rtcp-mux\r
`),t.ssrc!==void 0&&t.cname&&(s+="a=ssrc:"+t.ssrc+" cname:"+t.cname+`\r
`),s},e.parseMsid=function(t){let s;const r=e.matchPrefix(t,"a=msid:");if(r.length===1)return s=r[0].substring(7).split(" "),{stream:s[0],track:s[1]};const i=e.matchPrefix(t,"a=ssrc:").map(o=>e.parseSsrcMedia(o)).filter(o=>o.attribute==="msid");if(i.length>0)return s=i[0].value.split(" "),{stream:s[0],track:s[1]}},e.parseSctpDescription=function(t){const s=e.parseMLine(t),r=e.matchPrefix(t,"a=max-message-size:");let i;r.length>0&&(i=parseInt(r[0].substring(19),10)),isNaN(i)&&(i=65536);const o=e.matchPrefix(t,"a=sctp-port:");if(o.length>0)return{port:parseInt(o[0].substring(12),10),protocol:s.fmt,maxMessageSize:i};const a=e.matchPrefix(t,"a=sctpmap:");if(a.length>0){const c=a[0].substring(10).split(" ");return{port:parseInt(c[0],10),protocol:c[1],maxMessageSize:i}}},e.writeSctpDescription=function(t,s){let r=[];return t.protocol!=="DTLS/SCTP"?r=["m="+t.kind+" 9 "+t.protocol+" "+s.protocol+`\r
`,`c=IN IP4 0.0.0.0\r
`,"a=sctp-port:"+s.port+`\r
`]:r=["m="+t.kind+" 9 "+t.protocol+" "+s.port+`\r
`,`c=IN IP4 0.0.0.0\r
`,"a=sctpmap:"+s.port+" "+s.protocol+` 65535\r
`],s.maxMessageSize!==void 0&&r.push("a=max-message-size:"+s.maxMessageSize+`\r
`),r.join("")},e.generateSessionId=function(){return Math.random().toString().substr(2,22)},e.writeSessionBoilerplate=function(t,s,r){let i;const o=s!==void 0?s:2;return t?i=t:i=e.generateSessionId(),`v=0\r
o=`+(r||"thisisadapterortc")+" "+i+" "+o+` IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
`},e.getDirection=function(t,s){const r=e.splitLines(t);for(let i=0;i<r.length;i++)switch(r[i]){case"a=sendrecv":case"a=sendonly":case"a=recvonly":case"a=inactive":return r[i].substring(2)}return s?e.getDirection(s):"sendrecv"},e.getKind=function(t){return e.splitLines(t)[0].split(" ")[0].substring(2)},e.isRejected=function(t){return t.split(" ",2)[1]==="0"},e.parseMLine=function(t){const r=e.splitLines(t)[0].substring(2).split(" ");return{kind:r[0],port:parseInt(r[1],10),protocol:r[2],fmt:r.slice(3).join(" ")}},e.parseOLine=function(t){const r=e.matchPrefix(t,"o=")[0].substring(2).split(" ");return{username:r[0],sessionId:r[1],sessionVersion:parseInt(r[2],10),netType:r[3],addressType:r[4],address:r[5]}},e.isValidSDP=function(t){if(typeof t!="string"||t.length===0)return!1;const s=e.splitLines(t);for(let r=0;r<s.length;r++)if(s[r].length<2||s[r].charAt(1)!=="=")return!1;return!0},n.exports=e})(Rt);var Mt=Rt.exports;const V=ps(Mt),ds=P({__proto__:null,default:V},[Mt]);function ie(n){if(!n.RTCIceCandidate||n.RTCIceCandidate&&"foundation"in n.RTCIceCandidate.prototype)return;const e=n.RTCIceCandidate;n.RTCIceCandidate=function(s){if(typeof s=="object"&&s.candidate&&s.candidate.indexOf("a=")===0&&(s=JSON.parse(JSON.stringify(s)),s.candidate=s.candidate.substring(2)),s.candidate&&s.candidate.length){const r=new e(s),i=V.parseCandidate(s.candidate);for(const o in i)o in r||Object.defineProperty(r,o,{value:i[o]});return r.toJSON=function(){return{candidate:r.candidate,sdpMid:r.sdpMid,sdpMLineIndex:r.sdpMLineIndex,usernameFragment:r.usernameFragment}},r}return new e(s)},n.RTCIceCandidate.prototype=e.prototype,U(n,"icecandidate",t=>(t.candidate&&Object.defineProperty(t,"candidate",{value:new n.RTCIceCandidate(t.candidate),writable:"false"}),t))}function Se(n){!n.RTCIceCandidate||n.RTCIceCandidate&&"relayProtocol"in n.RTCIceCandidate.prototype||U(n,"icecandidate",e=>{if(e.candidate){const t=V.parseCandidate(e.candidate.candidate);t.type==="relay"&&(e.candidate.relayProtocol={0:"tls",1:"tcp",2:"udp"}[t.priority>>24])}return e})}function oe(n,e){if(!n.RTCPeerConnection)return;"sctp"in n.RTCPeerConnection.prototype||Object.defineProperty(n.RTCPeerConnection.prototype,"sctp",{get(){return typeof this._sctp>"u"?null:this._sctp}});const t=function(a){if(!a||!a.sdp)return!1;const c=V.splitSections(a.sdp);return c.shift(),c.some(l=>{const p=V.parseMLine(l);return p&&p.kind==="application"&&p.protocol.indexOf("SCTP")!==-1})},s=function(a){const c=a.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);if(c===null||c.length<2)return-1;const l=parseInt(c[1],10);return l!==l?-1:l},r=function(a){let c=65536;return e.browser==="firefox"&&(e.version<57?a===-1?c=16384:c=2147483637:e.version<60?c=e.version===57?65535:65536:c=2147483637),c},i=function(a,c){let l=65536;e.browser==="firefox"&&e.version===57&&(l=65535);const p=V.matchPrefix(a.sdp,"a=max-message-size:");return p.length>0?l=parseInt(p[0].substring(19),10):e.browser==="firefox"&&c!==-1&&(l=2147483637),l},o=n.RTCPeerConnection.prototype.setRemoteDescription;n.RTCPeerConnection.prototype.setRemoteDescription=function(){if(this._sctp=null,e.browser==="chrome"&&e.version>=76){const{sdpSemantics:c}=this.getConfiguration();c==="plan-b"&&Object.defineProperty(this,"sctp",{get(){return typeof this._sctp>"u"?null:this._sctp},enumerable:!0,configurable:!0})}if(t(arguments[0])){const c=s(arguments[0]),l=r(c),p=i(arguments[0],c);let d;l===0&&p===0?d=Number.POSITIVE_INFINITY:l===0||p===0?d=Math.max(l,p):d=Math.min(l,p);const h={};Object.defineProperty(h,"maxMessageSize",{get(){return d}}),this._sctp=h}return o.apply(this,arguments)}}function ae(n,e){if(!(n.RTCPeerConnection&&"createDataChannel"in n.RTCPeerConnection.prototype)||e.browser==="chrome"&&e.version>149||e.browser==="firefox"&&e.version>60)return;function t(r,i){const o=r.send;r.send=function(){const c=arguments[0],l=c.length||c.size||c.byteLength;if(r.readyState==="open"&&i.sctp&&l>i.sctp.maxMessageSize)throw new TypeError("Message too large (can send a maximum of "+i.sctp.maxMessageSize+" bytes)");return o.apply(r,arguments)}}const s=n.RTCPeerConnection.prototype.createDataChannel;n.RTCPeerConnection.prototype.createDataChannel=function(){const i=s.apply(this,arguments);return t(i,this),i},U(n,"datachannel",r=>(t(r.channel,r.target),r))}function Ce(n){if(!n.RTCPeerConnection||"connectionState"in n.RTCPeerConnection.prototype)return;const e=n.RTCPeerConnection.prototype;Object.defineProperty(e,"connectionState",{get(){return{completed:"connected",checking:"connecting"}[this.iceConnectionState]||this.iceConnectionState},enumerable:!0,configurable:!0}),Object.defineProperty(e,"onconnectionstatechange",{get(){return this._onconnectionstatechange||null},set(t){this._onconnectionstatechange&&(this.removeEventListener("connectionstatechange",this._onconnectionstatechange),delete this._onconnectionstatechange),t&&this.addEventListener("connectionstatechange",this._onconnectionstatechange=t)},enumerable:!0,configurable:!0}),["setLocalDescription","setRemoteDescription"].forEach(t=>{const s=e[t];e[t]=function(){return this._connectionstatechangepoly||(this._connectionstatechangepoly=r=>{const i=r.target;if(i._lastConnectionState!==i.connectionState){i._lastConnectionState=i.connectionState;const o=new Event("connectionstatechange",r);i.dispatchEvent(o)}return r},this.addEventListener("iceconnectionstatechange",this._connectionstatechangepoly)),s.apply(this,arguments)}})}function je(n,e){if(!n.RTCPeerConnection||e.browser==="chrome"&&e.version>=71||e.browser==="safari"&&e._safariVersion>=13.1)return;const t=n.RTCPeerConnection.prototype.setRemoteDescription;n.RTCPeerConnection.prototype.setRemoteDescription=function(r){if(r&&r.sdp&&r.sdp.indexOf(`
a=extmap-allow-mixed`)!==-1){const i=r.sdp.split(`
`).filter(o=>o.trim()!=="a=extmap-allow-mixed").join(`
`);n.RTCSessionDescription&&r instanceof n.RTCSessionDescription?arguments[0]=new n.RTCSessionDescription({type:r.type,sdp:i}):r.sdp=i}return t.apply(this,arguments)}}function ce(n,e){if(!(n.RTCPeerConnection&&n.RTCPeerConnection.prototype))return;const t=n.RTCPeerConnection.prototype.addIceCandidate;!t||t.length===0||(n.RTCPeerConnection.prototype.addIceCandidate=function(){return arguments[0]?(e.browser==="chrome"&&e.version<78||e.browser==="firefox"&&e.version<68||e.browser==="safari")&&arguments[0]&&arguments[0].candidate===""?Promise.resolve():t.apply(this,arguments):(arguments[1]&&arguments[1].apply(null),Promise.resolve())})}function le(n,e){if(!(n.RTCPeerConnection&&n.RTCPeerConnection.prototype))return;const t=n.RTCPeerConnection.prototype.setLocalDescription;!t||t.length===0||(n.RTCPeerConnection.prototype.setLocalDescription=function(){let r=arguments[0]||{};if(typeof r!="object"||r.type&&r.sdp)return t.apply(this,arguments);if(r={type:r.type,sdp:r.sdp},!r.type)switch(this.signalingState){case"stable":case"have-local-offer":case"have-remote-pranswer":r.type="offer";break;default:r.type="answer";break}return r.sdp||r.type!=="offer"&&r.type!=="answer"?t.apply(this,[r]):(r.type==="offer"?this.createOffer:this.createAnswer).apply(this).then(o=>t.apply(this,[o]))})}const hs=Object.freeze(Object.defineProperty({__proto__:null,removeExtmapAllowMixed:je,shimAddIceCandidateNullOrEmpty:ce,shimConnectionState:Ce,shimMaxMessageSize:oe,shimParameterlessSetLocalDescription:le,shimRTCIceCandidate:ie,shimRTCIceCandidateRelayProtocol:Se,shimSendThrowTypeError:ae},Symbol.toStringTag,{value:"Module"}));function us({window:n}={},e={shimChrome:!0,shimFirefox:!0,shimSafari:!0}){const t=ye,s=cs(n),r={browserDetails:s,commonShim:hs,extractVersion:J,disableLog:os,disableWarnings:as,sdp:ds};switch(s.browser){case"chrome":if(!ot||!xe||!e.shimChrome)return t("Chrome shim is not included in this adapter release."),r;if(s.version===null)return t("Chrome shim can not determine version, not shimming."),r;t("adapter.js shimming chrome."),r.browserShim=ot,ce(n,s),le(n),Ze(n,s),Qe(n),xe(n,s),et(n,s),rt(n,s),tt(n),st(n,s),it(n,s),ie(n),Se(n),Ce(n),oe(n,s),ae(n,s),je(n,s);break;case"firefox":if(!yt||!ke||!e.shimFirefox)return t("Firefox shim is not included in this adapter release."),r;t("adapter.js shimming firefox."),r.browserShim=yt,ce(n,s),le(n),at(n,s),ke(n,s),lt(n,s),ct(n),ht(n),pt(n),dt(n),ut(n),ft(n),mt(n),gt(n),bt(n),ie(n),Ce(n),oe(n,s),ae(n,s);break;case"safari":if(!Et||!e.shimSafari)return t("Safari shim is not included in this adapter release."),r;t("adapter.js shimming safari."),r.browserShim=Et,ce(n,s),le(n),Ct(n),Tt(n),xt(n),_t(n),vt(n),jt(n),kt(n),Pt(n),ie(n),Se(n),oe(n,s),ae(n,s),je(n,s);break;default:t("Unsupported browser!");break}return r}const wt=us({window:typeof window>"u"?void 0:window});function N(n,e,t,s){Object.defineProperty(n,e,{get:t,set:s,enumerable:!0,configurable:!0})}class It{constructor(){this.chunkedMTU=16300,this._dataCount=1,this.chunk=e=>{const t=[],s=e.byteLength,r=Math.ceil(s/this.chunkedMTU);let i=0,o=0;for(;o<s;){const a=Math.min(s,o+this.chunkedMTU),c=e.slice(o,a),l={__peerData:this._dataCount,n:i,data:c,total:r};t.push(l),o=a,i++}return this._dataCount++,t}}}function fs(n){let e=0;for(const r of n)e+=r.byteLength;const t=new Uint8Array(e);let s=0;for(const r of n)t.set(r,s),s+=r.byteLength;return t}const Te=wt.default||wt,K=new class{isWebRTCSupported(){return typeof RTCPeerConnection<"u"}isBrowserSupported(){const n=this.getBrowser(),e=this.getVersion();return this.supportedBrowsers.includes(n)?n==="chrome"?e>=this.minChromeVersion:n==="firefox"?e>=this.minFirefoxVersion:n==="safari"?!this.isIOS&&e>=this.minSafariVersion:!1:!1}getBrowser(){return Te.browserDetails.browser}getVersion(){return Te.browserDetails.version||0}isUnifiedPlanSupported(){const n=this.getBrowser(),e=Te.browserDetails.version||0;if(n==="chrome"&&e<this.minChromeVersion)return!1;if(n==="firefox"&&e>=this.minFirefoxVersion)return!0;if(!window.RTCRtpTransceiver||!("currentDirection"in RTCRtpTransceiver.prototype))return!1;let t,s=!1;try{t=new RTCPeerConnection,t.addTransceiver("audio"),s=!0}catch{}finally{t&&t.close()}return s}toString(){return`Supports:
    browser:${this.getBrowser()}
    version:${this.getVersion()}
    isIOS:${this.isIOS}
    isWebRTCSupported:${this.isWebRTCSupported()}
    isBrowserSupported:${this.isBrowserSupported()}
    isUnifiedPlanSupported:${this.isUnifiedPlanSupported()}`}constructor(){this.isIOS=typeof navigator<"u"?["iPad","iPhone","iPod"].includes(navigator.platform):!1,this.supportedBrowsers=["firefox","chrome","safari"],this.minFirefoxVersion=59,this.minChromeVersion=72,this.minSafariVersion=605}},ms=n=>!n||/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(n),Lt=()=>Math.random().toString(36).slice(2),At={iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:["turn:eu-0.turn.peerjs.com:3478","turn:us-0.turn.peerjs.com:3478"],username:"peerjs",credential:"peerjsp"}],sdpSemantics:"unified-plan"};class gs extends It{noop(){}blobToArrayBuffer(e,t){const s=new FileReader;return s.onload=function(r){r.target&&t(r.target.result)},s.readAsArrayBuffer(e),s}binaryStringToArrayBuffer(e){const t=new Uint8Array(e.length);for(let s=0;s<e.length;s++)t[s]=e.charCodeAt(s)&255;return t.buffer}isSecure(){return location.protocol==="https:"}constructor(...e){super(...e),this.CLOUD_HOST="0.peerjs.com",this.CLOUD_PORT=443,this.chunkedBrowsers={Chrome:1,chrome:1},this.defaultConfig=At,this.browser=K.getBrowser(),this.browserVersion=K.getVersion(),this.pack=qe,this.unpack=We,this.supports=function(){const t={browser:K.isBrowserSupported(),webRTC:K.isWebRTCSupported(),audioVideo:!1,data:!1,binaryBlob:!1,reliable:!1};if(!t.webRTC)return t;let s;try{s=new RTCPeerConnection(At),t.audioVideo=!0;let r;try{r=s.createDataChannel("_PEERJSTEST",{ordered:!0}),t.data=!0,t.reliable=!!r.ordered;try{r.binaryType="blob",t.binaryBlob=!K.isIOS}catch{}}catch{}finally{r&&r.close()}}catch{}finally{s&&s.close()}return t}(),this.validateId=ms,this.randomToken=Lt}}const L=new gs,bs="PeerJS: ";class ys{get logLevel(){return this._logLevel}set logLevel(e){this._logLevel=e}log(...e){this._logLevel>=3&&this._print(3,...e)}warn(...e){this._logLevel>=2&&this._print(2,...e)}error(...e){this._logLevel>=1&&this._print(1,...e)}setLogFunction(e){this._print=e}_print(e,...t){const s=[bs,...t];for(const r in s)s[r]instanceof Error&&(s[r]="("+s[r].name+") "+s[r].message);e>=3?console.log(...s):e>=2?console.warn("WARNING",...s):e>=1&&console.error("ERROR",...s)}constructor(){this._logLevel=0}}var g=new ys,Pe={},_s=Object.prototype.hasOwnProperty,w="~";function Z(){}Object.create&&(Z.prototype=Object.create(null),new Z().__proto__||(w=!1));function vs(n,e,t){this.fn=n,this.context=e,this.once=t||!1}function Dt(n,e,t,s,r){if(typeof t!="function")throw new TypeError("The listener must be a function");var i=new vs(t,s||n,r),o=w?w+e:e;return n._events[o]?n._events[o].fn?n._events[o]=[n._events[o],i]:n._events[o].push(i):(n._events[o]=i,n._eventsCount++),n}function pe(n,e){--n._eventsCount===0?n._events=new Z:delete n._events[e]}function E(){this._events=new Z,this._eventsCount=0}E.prototype.eventNames=function(){var e=[],t,s;if(this._eventsCount===0)return e;for(s in t=this._events)_s.call(t,s)&&e.push(w?s.slice(1):s);return Object.getOwnPropertySymbols?e.concat(Object.getOwnPropertySymbols(t)):e},E.prototype.listeners=function(e){var t=w?w+e:e,s=this._events[t];if(!s)return[];if(s.fn)return[s.fn];for(var r=0,i=s.length,o=new Array(i);r<i;r++)o[r]=s[r].fn;return o},E.prototype.listenerCount=function(e){var t=w?w+e:e,s=this._events[t];return s?s.fn?1:s.length:0},E.prototype.emit=function(e,t,s,r,i,o){var a=w?w+e:e;if(!this._events[a])return!1;var c=this._events[a],l=arguments.length,p,d;if(c.fn){switch(c.once&&this.removeListener(e,c.fn,void 0,!0),l){case 1:return c.fn.call(c.context),!0;case 2:return c.fn.call(c.context,t),!0;case 3:return c.fn.call(c.context,t,s),!0;case 4:return c.fn.call(c.context,t,s,r),!0;case 5:return c.fn.call(c.context,t,s,r,i),!0;case 6:return c.fn.call(c.context,t,s,r,i,o),!0}for(d=1,p=new Array(l-1);d<l;d++)p[d-1]=arguments[d];c.fn.apply(c.context,p)}else{var h=c.length,f;for(d=0;d<h;d++)switch(c[d].once&&this.removeListener(e,c[d].fn,void 0,!0),l){case 1:c[d].fn.call(c[d].context);break;case 2:c[d].fn.call(c[d].context,t);break;case 3:c[d].fn.call(c[d].context,t,s);break;case 4:c[d].fn.call(c[d].context,t,s,r);break;default:if(!p)for(f=1,p=new Array(l-1);f<l;f++)p[f-1]=arguments[f];c[d].fn.apply(c[d].context,p)}}return!0},E.prototype.on=function(e,t,s){return Dt(this,e,t,s,!1)},E.prototype.once=function(e,t,s){return Dt(this,e,t,s,!0)},E.prototype.removeListener=function(e,t,s,r){var i=w?w+e:e;if(!this._events[i])return this;if(!t)return pe(this,i),this;var o=this._events[i];if(o.fn)o.fn===t&&(!r||o.once)&&(!s||o.context===s)&&pe(this,i);else{for(var a=0,c=[],l=o.length;a<l;a++)(o[a].fn!==t||r&&!o[a].once||s&&o[a].context!==s)&&c.push(o[a]);c.length?this._events[i]=c.length===1?c[0]:c:pe(this,i)}return this},E.prototype.removeAllListeners=function(e){var t;return e?(t=w?w+e:e,this._events[t]&&pe(this,t)):(this._events=new Z,this._eventsCount=0),this},E.prototype.off=E.prototype.removeListener,E.prototype.addListener=E.prototype.on,E.prefixed=w,E.EventEmitter=E,Pe=E;var B={};N(B,"ConnectionType",()=>H),N(B,"PeerErrorType",()=>k),N(B,"BaseConnectionErrorType",()=>Ee),N(B,"DataConnectionErrorType",()=>Re),N(B,"SerializationType",()=>de),N(B,"SocketEventType",()=>z),N(B,"ServerMessageType",()=>R);var H=function(n){return n.Data="data",n.Media="media",n}({}),k=function(n){return n.BrowserIncompatible="browser-incompatible",n.Disconnected="disconnected",n.InvalidID="invalid-id",n.InvalidKey="invalid-key",n.Network="network",n.PeerUnavailable="peer-unavailable",n.SslUnavailable="ssl-unavailable",n.ServerError="server-error",n.SocketError="socket-error",n.SocketClosed="socket-closed",n.UnavailableID="unavailable-id",n.WebRTC="webrtc",n}({}),Ee=function(n){return n.NegotiationFailed="negotiation-failed",n.ConnectionClosed="connection-closed",n}({}),Re=function(n){return n.NotOpenYet="not-open-yet",n.MessageToBig="message-too-big",n}({}),de=function(n){return n.Binary="binary",n.BinaryUTF8="binary-utf8",n.JSON="json",n.None="raw",n}({}),z=function(n){return n.Message="message",n.Disconnected="disconnected",n.Error="error",n.Close="close",n}({}),R=function(n){return n.Heartbeat="HEARTBEAT",n.Candidate="CANDIDATE",n.Offer="OFFER",n.Answer="ANSWER",n.Open="OPEN",n.Error="ERROR",n.IdTaken="ID-TAKEN",n.InvalidKey="INVALID-KEY",n.Leave="LEAVE",n.Expire="EXPIRE",n}({});const $t="1.5.5";class xs extends Pe.EventEmitter{constructor(e,t,s,r,i,o=5e3){super(),this.pingInterval=o,this._disconnected=!0,this._messagesQueue=[];const a=e?"wss://":"ws://";this._baseUrl=a+t+":"+s+r+"peerjs?key="+i}start(e,t){this._id=e;const s=`${this._baseUrl}&id=${e}&token=${t}`;this._socket||!this._disconnected||(this._socket=new WebSocket(s+"&version="+$t),this._disconnected=!1,this._socket.onmessage=r=>{let i;try{i=JSON.parse(r.data),g.log("Server message received:",i)}catch{g.log("Invalid server message",r.data);return}this.emit(z.Message,i)},this._socket.onclose=r=>{this._disconnected||(g.log("Socket closed.",r),this._cleanup(),this._disconnected=!0,this.emit(z.Disconnected))},this._socket.onopen=()=>{this._disconnected||(this._sendQueuedMessages(),g.log("Socket open"),this._scheduleHeartbeat())})}_scheduleHeartbeat(){this._wsPingTimer=setTimeout(()=>{this._sendHeartbeat()},this.pingInterval)}_sendHeartbeat(){if(!this._wsOpen()){g.log("Cannot send heartbeat, because socket closed");return}const e=JSON.stringify({type:R.Heartbeat});this._socket.send(e),this._scheduleHeartbeat()}_wsOpen(){return!!this._socket&&this._socket.readyState===1}_sendQueuedMessages(){const e=[...this._messagesQueue];this._messagesQueue=[];for(const t of e)this.send(t)}send(e){if(this._disconnected)return;if(!this._id){this._messagesQueue.push(e);return}if(!e.type){this.emit(z.Error,"Invalid message");return}if(!this._wsOpen())return;const t=JSON.stringify(e);this._socket.send(t)}close(){this._disconnected||(this._cleanup(),this._disconnected=!0)}_cleanup(){this._socket&&(this._socket.onopen=this._socket.onmessage=this._socket.onclose=null,this._socket.close(),this._socket=void 0),clearTimeout(this._wsPingTimer)}}class Ot{constructor(e){this.connection=e}startConnection(e){const t=this._startPeerConnection();if(this.connection.peerConnection=t,this.connection.type===H.Media&&e._stream&&this._addTracksToConnection(e._stream,t),e.originator){const s=this.connection,r={ordered:!!e.reliable},i=t.createDataChannel(s.label,r);s._initializeDataChannel(i),this._makeOffer()}else this.handleSDP("OFFER",e.sdp)}_startPeerConnection(){g.log("Creating RTCPeerConnection.");const e=new RTCPeerConnection(this.connection.provider.options.config);return this._setupListeners(e),e}_setupListeners(e){const t=this.connection.peer,s=this.connection.connectionId,r=this.connection.type,i=this.connection.provider;g.log("Listening for ICE candidates."),e.onicecandidate=o=>{!o.candidate||!o.candidate.candidate||(g.log(`Received ICE candidates for ${t}:`,o.candidate),i.socket.send({type:R.Candidate,payload:{candidate:o.candidate,type:r,connectionId:s},dst:t}))},e.oniceconnectionstatechange=()=>{switch(e.iceConnectionState){case"failed":g.log("iceConnectionState is failed, closing connections to "+t),this.connection.emitError(Ee.NegotiationFailed,"Negotiation of connection to "+t+" failed."),this.connection.close();break;case"closed":g.log("iceConnectionState is closed, closing connections to "+t),this.connection.emitError(Ee.ConnectionClosed,"Connection to "+t+" closed."),this.connection.close();break;case"disconnected":g.log("iceConnectionState changed to disconnected on the connection with "+t);break;case"completed":e.onicecandidate=()=>{};break}this.connection.emit("iceStateChanged",e.iceConnectionState)},g.log("Listening for data channel"),e.ondatachannel=o=>{g.log("Received data channel");const a=o.channel;i.getConnection(t,s)._initializeDataChannel(a)},g.log("Listening for remote stream"),e.ontrack=o=>{g.log("Received remote stream");const a=o.streams[0],c=i.getConnection(t,s);if(c.type===H.Media){const l=c;this._addStreamToMediaConnection(a,l)}}}cleanup(){g.log("Cleaning up PeerConnection to "+this.connection.peer);const e=this.connection.peerConnection;if(!e)return;this.connection.peerConnection=null,e.onicecandidate=e.oniceconnectionstatechange=e.ondatachannel=e.ontrack=()=>{};const t=e.signalingState!=="closed";let s=!1;const r=this.connection.dataChannel;r&&(s=!!r.readyState&&r.readyState!=="closed"),(t||s)&&e.close()}async _makeOffer(){const e=this.connection.peerConnection,t=this.connection.provider;try{const s=await e.createOffer(this.connection.options.constraints);g.log("Created offer."),this.connection.options.sdpTransform&&typeof this.connection.options.sdpTransform=="function"&&(s.sdp=this.connection.options.sdpTransform(s.sdp)||s.sdp);try{await e.setLocalDescription(s),g.log("Set localDescription:",s,`for:${this.connection.peer}`);let r={sdp:s,type:this.connection.type,connectionId:this.connection.connectionId,metadata:this.connection.metadata};if(this.connection.type===H.Data){const i=this.connection;r={...r,label:i.label,reliable:i.reliable,serialization:i.serialization}}t.socket.send({type:R.Offer,payload:r,dst:this.connection.peer})}catch(r){r!="OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"&&(t.emitError(k.WebRTC,r),g.log("Failed to setLocalDescription, ",r))}}catch(s){t.emitError(k.WebRTC,s),g.log("Failed to createOffer, ",s)}}async _makeAnswer(){const e=this.connection.peerConnection,t=this.connection.provider;try{const s=await e.createAnswer();g.log("Created answer."),this.connection.options.sdpTransform&&typeof this.connection.options.sdpTransform=="function"&&(s.sdp=this.connection.options.sdpTransform(s.sdp)||s.sdp);try{await e.setLocalDescription(s),g.log("Set localDescription:",s,`for:${this.connection.peer}`),t.socket.send({type:R.Answer,payload:{sdp:s,type:this.connection.type,connectionId:this.connection.connectionId},dst:this.connection.peer})}catch(r){t.emitError(k.WebRTC,r),g.log("Failed to setLocalDescription, ",r)}}catch(s){t.emitError(k.WebRTC,s),g.log("Failed to create answer, ",s)}}async handleSDP(e,t){t=new RTCSessionDescription(t);const s=this.connection.peerConnection,r=this.connection.provider;g.log("Setting remote description",t);const i=this;try{await s.setRemoteDescription(t),g.log(`Set remoteDescription:${e} for:${this.connection.peer}`),e==="OFFER"&&await i._makeAnswer()}catch(o){r.emitError(k.WebRTC,o),g.log("Failed to setRemoteDescription, ",o)}}async handleCandidate(e){g.log("handleCandidate:",e);try{await this.connection.peerConnection.addIceCandidate(e),g.log(`Added ICE candidate for:${this.connection.peer}`)}catch(t){this.connection.provider.emitError(k.WebRTC,t),g.log("Failed to handleCandidate, ",t)}}_addTracksToConnection(e,t){if(g.log(`add tracks from stream ${e.id} to peer connection`),!t.addTrack)return g.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");e.getTracks().forEach(s=>{t.addTrack(s,e)})}_addStreamToMediaConnection(e,t){g.log(`add stream ${e.id} to media connection ${t.connectionId}`),t.addStream(e)}}class Ht extends Pe.EventEmitter{emitError(e,t){g.error("Error:",t),this.emit("error",new ks(`${e}`,t))}}class ks extends Error{constructor(e,t){typeof t=="string"?super(t):(super(),Object.assign(this,t)),this.type=e}}class zt extends Ht{get open(){return this._open}constructor(e,t,s){super(),this.peer=e,this.provider=t,this.options=s,this._open=!1,this.metadata=s.metadata}}const ee=class ee extends zt{get type(){return H.Media}get localStream(){return this._localStream}get remoteStream(){return this._remoteStream}constructor(e,t,s){super(e,t,s),this._localStream=this.options._stream,this.connectionId=this.options.connectionId||ee.ID_PREFIX+L.randomToken(),this._negotiator=new Ot(this),this._localStream&&this._negotiator.startConnection({_stream:this._localStream,originator:!0})}_initializeDataChannel(e){this.dataChannel=e,this.dataChannel.onopen=()=>{g.log(`DC#${this.connectionId} dc connection success`),this.emit("willCloseOnRemote")},this.dataChannel.onclose=()=>{g.log(`DC#${this.connectionId} dc closed for:`,this.peer),this.close()}}addStream(e){g.log("Receiving stream",e),this._remoteStream=e,super.emit("stream",e)}handleMessage(e){const t=e.type,s=e.payload;switch(e.type){case R.Answer:this._negotiator.handleSDP(t,s.sdp),this._open=!0;break;case R.Candidate:this._negotiator.handleCandidate(s.candidate);break;default:g.warn(`Unrecognized message type:${t} from peer:${this.peer}`);break}}answer(e,t={}){if(this._localStream){g.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");return}this._localStream=e,t&&t.sdpTransform&&(this.options.sdpTransform=t.sdpTransform),this._negotiator.startConnection({...this.options._payload,_stream:e});const s=this.provider._getMessages(this.connectionId);for(const r of s)this.handleMessage(r);this._open=!0}close(){this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this._localStream=null,this._remoteStream=null,this.provider&&(this.provider._removeConnection(this),this.provider=null),this.options&&this.options._stream&&(this.options._stream=null),this.open&&(this._open=!1,super.emit("close"))}};ze=new WeakMap,re(ee,ze,ee.ID_PREFIX="mc_");let he=ee;class Ss{constructor(e){this._options=e}_buildRequest(e){const t=this._options.secure?"https":"http",{host:s,port:r,path:i,key:o}=this._options,a=new URL(`${t}://${s}:${r}${i}${o}/${e}`);return a.searchParams.set("ts",`${Date.now()}${Math.random()}`),a.searchParams.set("version",$t),fetch(a.href,{referrerPolicy:this._options.referrerPolicy})}async retrieveId(){try{const e=await this._buildRequest("id");if(e.status!==200)throw new Error(`Error. Status:${e.status}`);return e.text()}catch(e){g.error("Error retrieving ID",e);let t="";throw this._options.path==="/"&&this._options.host!==L.CLOUD_HOST&&(t=" If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer."),new Error("Could not get an ID from the server."+t)}}async listAllPeers(){try{const e=await this._buildRequest("peers");if(e.status!==200){if(e.status===401){let t="";throw this._options.host===L.CLOUD_HOST?t="It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.":t="You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.",new Error("It doesn't look like you have permission to list peers IDs. "+t)}throw new Error(`Error. Status:${e.status}`)}return e.json()}catch(e){throw g.error("Error retrieving list peers",e),new Error("Could not get list peers from the server."+e)}}}const W=class W extends zt{get type(){return H.Data}constructor(e,t,s){super(e,t,s),this.connectionId=this.options.connectionId||W.ID_PREFIX+Lt(),this.label=this.options.label||this.connectionId,this.reliable=!!this.options.reliable,this._negotiator=new Ot(this),this._negotiator.startConnection(this.options._payload||{originator:!0,reliable:this.reliable})}_initializeDataChannel(e){this.dataChannel=e,this.dataChannel.onopen=()=>{g.log(`DC#${this.connectionId} dc connection success`),this._open=!0,this.emit("open")},this.dataChannel.onmessage=t=>{g.log(`DC#${this.connectionId} dc onmessage:`,t.data)},this.dataChannel.onclose=()=>{g.log(`DC#${this.connectionId} dc closed for:`,this.peer),this.close()}}close(e){if(e!=null&&e.flush){this.send({__peerData:{type:"close"}});return}this._negotiator&&(this._negotiator.cleanup(),this._negotiator=null),this.provider&&(this.provider._removeConnection(this),this.provider=null),this.dataChannel&&(this.dataChannel.onopen=null,this.dataChannel.onmessage=null,this.dataChannel.onclose=null,this.dataChannel=null),this.open&&(this._open=!1,super.emit("close"))}send(e,t=!1){if(!this.open){this.emitError(Re.NotOpenYet,"Connection is not open. You should listen for the `open` event before sending messages.");return}return this._send(e,t)}async handleMessage(e){const t=e.payload;switch(e.type){case R.Answer:await this._negotiator.handleSDP(e.type,t.sdp);break;case R.Candidate:await this._negotiator.handleCandidate(t.candidate);break;default:g.warn("Unrecognized message type:",e.type,"from peer:",this.peer);break}}};Ue=new WeakMap,Ne=new WeakMap,re(W,Ue,W.ID_PREFIX="dc_"),re(W,Ne,W.MAX_BUFFERED_AMOUNT=8388608);let ue=W;class Me extends ue{get bufferSize(){return this._bufferSize}_initializeDataChannel(e){super._initializeDataChannel(e),this.dataChannel.binaryType="arraybuffer",this.dataChannel.addEventListener("message",t=>this._handleDataMessage(t))}_bufferedSend(e){(this._buffering||!this._trySend(e))&&(this._buffer.push(e),this._bufferSize=this._buffer.length)}_trySend(e){if(!this.open)return!1;if(this.dataChannel.bufferedAmount>ue.MAX_BUFFERED_AMOUNT)return this._buffering=!0,setTimeout(()=>{this._buffering=!1,this._tryBuffer()},50),!1;try{this.dataChannel.send(e)}catch(t){return g.error(`DC#:${this.connectionId} Error when sending:`,t),this._buffering=!0,this.close(),!1}return!0}_tryBuffer(){if(!this.open||this._buffer.length===0)return;const e=this._buffer[0];this._trySend(e)&&(this._buffer.shift(),this._bufferSize=this._buffer.length,this._tryBuffer())}close(e){if(e!=null&&e.flush){this.send({__peerData:{type:"close"}});return}this._buffer=[],this._bufferSize=0,super.close()}constructor(...e){super(...e),this._buffer=[],this._bufferSize=0,this._buffering=!1}}class we extends Me{close(e){super.close(e),this._chunkedData={}}constructor(e,t,s){super(e,t,s),this.chunker=new It,this.serialization=de.Binary,this._chunkedData={}}_handleDataMessage({data:e}){const t=We(e),s=t.__peerData;if(s){if(s.type==="close"){this.close();return}this._handleChunk(t);return}this.emit("data",t)}_handleChunk(e){const t=e.__peerData,s=this._chunkedData[t]||{data:[],count:0,total:e.total};if(s.data[e.n]=new Uint8Array(e.data),s.count++,this._chunkedData[t]=s,s.total===s.count){delete this._chunkedData[t];const r=fs(s.data);this._handleDataMessage({data:r})}}_send(e,t){const s=qe(e);if(s instanceof Promise)return this._send_blob(s);if(!t&&s.byteLength>this.chunker.chunkedMTU){this._sendChunks(s);return}this._bufferedSend(s)}async _send_blob(e){const t=await e;if(t.byteLength>this.chunker.chunkedMTU){this._sendChunks(t);return}this._bufferedSend(t)}_sendChunks(e){const t=this.chunker.chunk(e);g.log(`DC#${this.connectionId} Try to send ${t.length} chunks...`);for(const s of t)this.send(s,!0)}}class Cs extends Me{_handleDataMessage({data:e}){super.emit("data",e)}_send(e,t){this._bufferedSend(e)}constructor(...e){super(...e),this.serialization=de.None}}class js extends Me{_handleDataMessage({data:e}){const t=this.parse(this.decoder.decode(e)),s=t.__peerData;if(s&&s.type==="close"){this.close();return}this.emit("data",t)}_send(e,t){const s=this.encoder.encode(this.stringify(e));if(s.byteLength>=L.chunkedMTU){this.emitError(Re.MessageToBig,"Message too big for JSON channel");return}this._bufferedSend(s)}constructor(...e){super(...e),this.serialization=de.JSON,this.encoder=new TextEncoder,this.decoder=new TextDecoder,this.stringify=JSON.stringify,this.parse=JSON.parse}}const te=class te extends Ht{get id(){return this._id}get options(){return this._options}get open(){return this._open}get socket(){return this._socket}get connections(){const e=Object.create(null);for(const[t,s]of this._connections)e[t]=s;return e}get destroyed(){return this._destroyed}get disconnected(){return this._disconnected}constructor(e,t){super(),this._serializers={raw:Cs,json:js,binary:we,"binary-utf8":we,default:we},this._id=null,this._lastServerId=null,this._destroyed=!1,this._disconnected=!1,this._open=!1,this._connections=new Map,this._lostMessages=new Map;let s;if(e&&e.constructor==Object?t=e:e&&(s=e.toString()),t={debug:0,host:L.CLOUD_HOST,port:L.CLOUD_PORT,path:"/",key:te.DEFAULT_KEY,token:L.randomToken(),config:L.defaultConfig,referrerPolicy:"strict-origin-when-cross-origin",serializers:{},...t},this._options=t,this._serializers={...this._serializers,...this.options.serializers},this._options.host==="/"&&(this._options.host=window.location.hostname),this._options.path&&(this._options.path[0]!=="/"&&(this._options.path="/"+this._options.path),this._options.path[this._options.path.length-1]!=="/"&&(this._options.path+="/")),this._options.secure===void 0&&this._options.host!==L.CLOUD_HOST?this._options.secure=L.isSecure():this._options.host==L.CLOUD_HOST&&(this._options.secure=!0),this._options.logFunction&&g.setLogFunction(this._options.logFunction),g.logLevel=this._options.debug||0,this._api=new Ss(t),this._socket=this._createServerConnection(),!L.supports.audioVideo&&!L.supports.data){this._delayedAbort(k.BrowserIncompatible,"The current browser does not support WebRTC");return}if(s&&!L.validateId(s)){this._delayedAbort(k.InvalidID,`ID "${s}" is invalid`);return}s?this._initialize(s):this._api.retrieveId().then(r=>this._initialize(r)).catch(r=>this._abort(k.ServerError,r))}_createServerConnection(){const e=new xs(this._options.secure,this._options.host,this._options.port,this._options.path,this._options.key,this._options.pingInterval);return e.on(z.Message,t=>{this._handleMessage(t)}),e.on(z.Error,t=>{this._abort(k.SocketError,t)}),e.on(z.Disconnected,()=>{this.disconnected||(this.emitError(k.Network,"Lost connection to server."),this.disconnect())}),e.on(z.Close,()=>{this.disconnected||this._abort(k.SocketClosed,"Underlying socket is already closed.")}),e}_initialize(e){this._id=e,this.socket.start(e,this._options.token)}_handleMessage(e){const t=e.type,s=e.payload,r=e.src;switch(t){case R.Open:this._lastServerId=this.id,this._open=!0,this.emit("open",this.id);break;case R.Error:this._abort(k.ServerError,s.msg);break;case R.IdTaken:this._abort(k.UnavailableID,`ID "${this.id}" is taken`);break;case R.InvalidKey:this._abort(k.InvalidKey,`API KEY "${this._options.key}" is invalid`);break;case R.Leave:g.log(`Received leave message from ${r}`),this._cleanupPeer(r),this._connections.delete(r);break;case R.Expire:this.emitError(k.PeerUnavailable,`Could not connect to peer ${r}`);break;case R.Offer:{const i=s.connectionId;let o=this.getConnection(r,i);if(o&&(o.close(),g.warn(`Offer received for existing Connection ID:${i}`)),s.type===H.Media){const c=new he(r,this,{connectionId:i,_payload:s,metadata:s.metadata});o=c,this._addConnection(r,o),this.emit("call",c)}else if(s.type===H.Data){const c=new this._serializers[s.serialization](r,this,{connectionId:i,_payload:s,metadata:s.metadata,label:s.label,serialization:s.serialization,reliable:s.reliable});o=c,this._addConnection(r,o),this.emit("connection",c)}else{g.warn(`Received malformed connection type:${s.type}`);return}const a=this._getMessages(i);for(const c of a)o.handleMessage(c);break}default:{if(!s){g.warn(`You received a malformed message from ${r} of type ${t}`);return}const i=s.connectionId,o=this.getConnection(r,i);o&&o.peerConnection?o.handleMessage(e):i?this._storeMessage(i,e):g.warn("You received an unrecognized message:",e);break}}}_storeMessage(e,t){this._lostMessages.has(e)||this._lostMessages.set(e,[]),this._lostMessages.get(e).push(t)}_getMessages(e){const t=this._lostMessages.get(e);return t?(this._lostMessages.delete(e),t):[]}connect(e,t={}){if(t={serialization:"default",...t},this.disconnected){g.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available."),this.emitError(k.Disconnected,"Cannot connect to new Peer after disconnecting from server.");return}const s=new this._serializers[t.serialization](e,this,t);return this._addConnection(e,s),s}call(e,t,s={}){if(this.disconnected){g.warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect."),this.emitError(k.Disconnected,"Cannot connect to new Peer after disconnecting from server.");return}if(!t){g.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");return}const r=new he(e,this,{...s,_stream:t});return this._addConnection(e,r),r}_addConnection(e,t){g.log(`add connection ${t.type}:${t.connectionId} to peerId:${e}`),this._connections.has(e)||this._connections.set(e,[]),this._connections.get(e).push(t)}_removeConnection(e){const t=this._connections.get(e.peer);if(t){const s=t.indexOf(e);s!==-1&&t.splice(s,1)}this._lostMessages.delete(e.connectionId)}getConnection(e,t){const s=this._connections.get(e);if(!s)return null;for(const r of s)if(r.connectionId===t)return r;return null}_delayedAbort(e,t){setTimeout(()=>{this._abort(e,t)},0)}_abort(e,t){g.error("Aborting!"),this.emitError(e,t),this._lastServerId?this.disconnect():this.destroy()}destroy(){this.destroyed||(g.log(`Destroy peer with ID:${this.id}`),this.disconnect(),this._cleanup(),this._destroyed=!0,this.emit("close"))}_cleanup(){for(const e of this._connections.keys())this._cleanupPeer(e),this._connections.delete(e);this.socket.removeAllListeners()}_cleanupPeer(e){const t=this._connections.get(e);if(t)for(const s of t)s.close()}disconnect(){if(this.disconnected)return;const e=this.id;g.log(`Disconnect peer with ID:${e}`),this._disconnected=!0,this._open=!1,this.socket.close(),this._lastServerId=e,this._id=null,this.emit("disconnected",e)}reconnect(){if(this.disconnected&&!this.destroyed)g.log(`Attempting reconnection to server with ID ${this._lastServerId}`),this._disconnected=!1,this._initialize(this._lastServerId);else{if(this.destroyed)throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");if(!this.disconnected&&!this.open)g.error("In a hurry? We're still trying to make the initial connection!");else throw new Error(`Peer ${this.id} cannot reconnect because it is not disconnected from the server!`)}}listAllPeers(e=t=>{}){this._api.listAllPeers().then(t=>e(t)).catch(t=>this._abort(k.ServerError,t))}};Be=new WeakMap,re(te,Be,te.DEFAULT_KEY="peerjs");let Ie=te;var Ut=Ie;const m={JOIN:"join",LEAVE:"leave",USER_LIST:"user-list",USERNAME_UPDATE:"username-update",CHAT:"chat",PRIVATE_CHAT:"private-chat",JUMP_SLIDE:"jump-slide",FOLLOW_MODE:"follow-mode",SLIDE_CHANGE:"slide-change",POLL_START:"poll-start",POLL_ANSWER:"poll-answer",POLL_RESULTS:"poll-results",PONG_INVITE:"pong-invite",PONG_ACCEPT:"pong-accept",PONG_DECLINE:"pong-decline",PONG_STATE:"pong-state",PONG_MOVE:"pong-move",PONG_SCORE:"pong-score",PONG_END:"pong-end",ARENA_START:"arena-start",ARENA_STATE:"arena-state",ARENA_INPUT:"arena-input",ARENA_SHOOT:"arena-shoot",ARENA_HIT:"arena-hit",ARENA_END:"arena-end"};function x(n,e){return{type:n,payload:e,timestamp:Date.now()}}function Ts(n){let e=0;for(let t=0;t<n.length;t++){const s=n.charCodeAt(t);e=(e<<5)-e+s,e|=0}return Math.abs(e).toString(36)}function Ps(){const n=window.location.href.split("#")[0];return`reveal-lobby-${Ts(n)}`}class Es{constructor(){this.peer=null,this.isHub=!1,this.lobbyId=Ps(),this.myId=null,this.myUser=null,this.users=new Map,this.connections=new Map,this.chatMessages=[],this.followMode=!1,this.listeners=new Map,this._visitorCounter=0,this._destroyed=!1,this._hubSyncSeq=0,this._lastHubSyncSeqByType=new Map}on(e,t){this.listeners.has(e)||this.listeners.set(e,[]),this.listeners.get(e).push(t)}off(e,t){if(this.listeners.has(e)){const s=this.listeners.get(e).filter(r=>r!==t);this.listeners.set(e,s)}}_emit(e,t){if(this.listeners.has(e))for(const s of this.listeners.get(e))try{s(t)}catch(r){console.error("[RevealPeerJS] Listener error:",r)}}connect(e){return new Promise((t,s)=>{const r=e.username||"Visitor",i=e.color||"#4fc3f7",o=new Ut(this.lobbyId,{debug:0,config:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]}});let a=!1;o.on("open",c=>{this.peer=o,this.isHub=!0,this.myId=c;const l=r.startsWith("Visitor")?"Visitor #1 (Hub)":r;this.myUser={id:c,username:l,color:i,isHub:!0,number:0},this.users.set(c,{...this.myUser,conn:null}),a=!0,this._emit("connected",{isHub:!0,user:this.myUser}),this._emit("user-list",this.getUserList()),t({isHub:!0})}),o.on("error",c=>{c.type==="unavailable-id"&&!a?(a=!0,o.destroy(),this._connectAsVisitor(r,i).then(t).catch(s)):a||(this._emit("error",c),s(c))}),setTimeout(()=>{a||(a=!0,o.destroy(),this._connectAsVisitor(r,i).then(t).catch(s))},5e3),o.on("connection",c=>{this._handleHubConnection(c)})})}_connectAsVisitor(e,t){return new Promise((s,r)=>{const i=new Ut(void 0,{debug:0,config:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}]}});i.on("open",o=>{this.peer=i,this.isHub=!1,this.myId=o;const a=i.connect(this.lobbyId,{reliable:!0});a.on("open",()=>{this.connections.set(this.lobbyId,a),a.send(x(m.JOIN,{id:o,username:e,color:t,isHub:!1})),this.myUser={id:o,username:e,color:t,isHub:!1,number:-1},this._emit("connected",{isHub:!1,user:this.myUser}),s({isHub:!1})}),a.on("data",c=>{this._handleIncomingMessage(c,a,this.lobbyId)}),a.on("close",()=>{this._emit("disconnected",{peerId:this.lobbyId})}),a.on("error",c=>{this._emit("error",c)})}),i.on("error",o=>{this._emit("error",o),r(o)}),i.on("connection",o=>{this._handleDirectConnection(o)})})}_handleHubConnection(e){e.on("open",()=>{this.connections.set(e.peer,e),this._emit("peer-connected",{peerId:e.peer})}),e.on("data",t=>{this._handleHubMessage(t,e)}),e.on("close",()=>{const t=this.users.get(e.peer);t&&(this.users.delete(e.peer),this.connections.delete(e.peer),this._broadcastFromHub(x(m.LEAVE,{id:e.peer,username:t.username})),this._emit("user-list",this.getUserList()),this._emit("peer-disconnected",{peerId:e.peer,username:t.username}))}),e.on("error",t=>{console.error("[RevealPeerJS] Hub connection error:",t)})}_handleDirectConnection(e){e.on("open",()=>{this.connections.set(e.peer,e)}),e.on("data",t=>{this._handleIncomingMessage(t,e,e.peer)}),e.on("close",()=>{this.connections.delete(e.peer)})}_handleHubMessage(e,t){if(!e||!e.type)return;const s=e;switch(s.type){case m.JOIN:{this._visitorCounter++;const r=s.payload.username&&!s.payload.username.startsWith("Visitor")?s.payload.username:`Visitor #${this._visitorCounter}`,i={id:s.payload.id,username:r,color:s.payload.color||"#4fc3f7",isHub:!1,number:this._visitorCounter,conn:t};this.users.set(s.payload.id,i),t.send(x(m.USER_LIST,{yourNumber:this._visitorCounter,yourAssignedName:i.username,users:this.getUserList(),chatHistory:this.chatMessages.slice(-50)})),this._broadcastFromHub(x(m.USER_LIST,{users:this.getUserList()}),s.payload.id),this._emit("user-list",this.getUserList()),this._emit("peer-connected",{peerId:s.payload.id,username:i.username});break}case m.CHAT:{const r={from:s.payload.from||t.peer,username:s.payload.username,color:s.payload.color,text:s.payload.text,timestamp:s.timestamp,private:!1};this.chatMessages.push(r),this._broadcastFromHub(x(m.CHAT,r)),this._emit("chat",r);break}case m.PRIVATE_CHAT:{const r={from:s.payload.from||t.peer,to:s.payload.to,username:s.payload.username,color:s.payload.color,text:s.payload.text,timestamp:s.timestamp,private:!0};this._sendToPeer(s.payload.to,x(m.PRIVATE_CHAT,r)),this._emit("chat",r);break}case m.SLIDE_CHANGE:{this.followMode&&s.payload.from===this._followTarget&&this._broadcastFromHub(x(m.JUMP_SLIDE,{indexh:s.payload.indexh,indexv:s.payload.indexv}),t.peer);break}case m.POLL_ANSWER:{this._emit("poll-answer",s.payload);break}case m.PONG_MOVE:case m.PONG_STATE:case m.PONG_ACCEPT:case m.PONG_DECLINE:case m.PONG_SCORE:case m.PONG_END:{const r={...s.payload,from:t.peer};r.to&&this._sendToPeer(r.to,this._createHubMessage(s.type,r)),this._emit(s.type,r);break}case m.ARENA_INPUT:case m.ARENA_SHOOT:{this._emit(s.type,{...s.payload,from:t.peer});break}case m.USERNAME_UPDATE:{const r=this.users.get(s.payload.id);r&&(r.username=s.payload.username,r.color=s.payload.color,this.users.set(s.payload.id,r),this._broadcastFromHub(x(m.USER_LIST,{users:this.getUserList()})),this._emit("user-list",this.getUserList()));break}default:this._emit("raw-message",s)}}_handleIncomingMessage(e,t,s){if(!e||!e.type)return;const r=e;switch(r.type){case m.USER_LIST:{if(r.payload.yourNumber!==void 0&&(this.myUser.number=r.payload.yourNumber,(!this.myUser.username||this.myUser.username.startsWith("slide-visitor"))&&(this.myUser.username=r.payload.yourAssignedName||`slide-visitor#${r.payload.yourNumber}`),this._emit("assigned-name",this.myUser.username)),r.payload.users){for(const o of r.payload.users)o.id!==this.myId&&this.users.set(o.id,{...o,conn:null});const i=new Set(r.payload.users.map(o=>o.id));i.add(this.myId);for(const[o]of this.users)i.has(o)||this.users.delete(o)}r.payload.chatHistory&&(this.chatMessages=r.payload.chatHistory,this._emit("chat-history",r.payload.chatHistory)),this._emit("user-list",this.getUserList());break}case m.LEAVE:{this.users.delete(r.payload.id),this._emit("user-list",this.getUserList()),this._emit("peer-disconnected",r.payload);break}case m.CHAT:{this.chatMessages.push(r.payload),this._emit("chat",r.payload);break}case m.PRIVATE_CHAT:{this.chatMessages.push(r.payload),this._emit("chat",r.payload);break}case m.JUMP_SLIDE:{this._emit("jump-slide",r.payload);break}case m.FOLLOW_MODE:{this.followMode=r.payload.active,this._followTarget=r.payload.target,this._emit("follow-mode",r.payload);break}case m.POLL_START:{this._emit("poll-start",r.payload);break}case m.POLL_RESULTS:{this._emit("poll-results",r.payload);break}case m.PONG_INVITE:case m.PONG_MOVE:case m.PONG_ACCEPT:case m.PONG_DECLINE:case m.PONG_STATE:case m.PONG_SCORE:case m.PONG_END:{this._shouldAcceptHubSyncedMessage(r)&&this._emit(r.type,r.payload);break}case m.ARENA_START:case m.ARENA_STATE:case m.ARENA_HIT:case m.ARENA_END:{this._shouldAcceptHubSyncedMessage(r)&&this._emit(r.type,r.payload);break}case m.ARENA_INPUT:case m.ARENA_SHOOT:break;default:this._emit("raw-message",r)}}_broadcastFromHub(e,t=null){for(const[s,r]of this.connections)if(s!==t&&r&&r.open)try{r.send(e)}catch(i){console.warn("[RevealPeerJS] Failed to send to",s,i)}}_sendToPeer(e,t){const s=this.connections.get(e);if(s&&s.open)try{s.send(t)}catch(r){console.warn("[RevealPeerJS] Failed to send to",e,r)}}_createHubMessage(e,t={}){return x(e,{...t,hubSync:{hubId:this.myId,seq:++this._hubSyncSeq}})}_shouldAcceptHubSyncedMessage(e){var o;const t=(o=e==null?void 0:e.payload)==null?void 0:o.hubSync;if(!t||typeof t.seq!="number")return!0;const s=t.hubId||"unknown-hub",r=`${e.type}:${s}`,i=this._lastHubSyncSeqByType.get(r)||0;return t.seq<=i?!1:(this._lastHubSyncSeqByType.set(r,t.seq),!0)}sendChat(e,t=null){const s={from:this.myId,username:this.myUser.username,color:this.myUser.color,text:e};if(this.isHub)if(t){const r={...s,to:t,private:!0};this.chatMessages.push(r),this._sendToPeer(t,x(m.PRIVATE_CHAT,r)),this._emit("chat",r)}else{const r={...s,private:!1};this.chatMessages.push(r),this._broadcastFromHub(x(m.CHAT,r)),this._emit("chat",r)}else t?this._sendToPeer(this.lobbyId,x(m.PRIVATE_CHAT,{...s,to:t})):this._sendToPeer(this.lobbyId,x(m.CHAT,s))}jumpAllToSlide(e,t){this.isHub&&this._broadcastFromHub(x(m.JUMP_SLIDE,{indexh:e,indexv:t}))}setFollowMode(e,t=null){this.isHub&&(this.followMode=e,this._followTarget=t,this._broadcastFromHub(x(m.FOLLOW_MODE,{active:e,target:t})),this._emit("follow-mode",{active:e,target:t}))}startPoll(e){this.isHub&&(this._broadcastFromHub(x(m.POLL_START,e)),this._emit("poll-start",e))}answerPoll(e,t){const s=x(m.POLL_ANSWER,{pollId:e,answer:t,from:this.myId,username:this.myUser.username});this.isHub?this._emit("poll-answer",s.payload):this._sendToPeer(this.lobbyId,s)}sendPollResults(e){this.isHub&&(this._broadcastFromHub(x(m.POLL_RESULTS,e)),this._emit("poll-results",e))}reportSlideChange(e,t){this.isHub||this._sendToPeer(this.lobbyId,x(m.SLIDE_CHANGE,{from:this.myId,indexh:e,indexv:t}))}updateProfile(e,t){if(this.myUser.username=e,this.myUser.color=t,this.isHub){const s=this.users.get(this.myId);s&&(s.username=e,s.color=t),this._broadcastFromHub(x(m.USER_LIST,{users:this.getUserList()})),this._emit("user-list",this.getUserList())}else this._sendToPeer(this.lobbyId,x(m.USERNAME_UPDATE,{id:this.myId,username:e,color:t}))}sendPongInvite(e){const t=x(m.PONG_INVITE,{from:this.myId,fromUsername:this.myUser.username,to:e});this.isHub?this._sendToPeer(e,t):this._sendToPeer(this.lobbyId,t)}sendPongMove(e,t){const s={from:this.myId,to:e,y:t};this.isHub?this._sendToPeer(e,this._createHubMessage(m.PONG_MOVE,s)):this._sendToPeer(this.lobbyId,x(m.PONG_MOVE,s))}sendPongState(e,t){const s={from:this.myId,to:e,state:t};this.isHub?this._sendToPeer(e,this._createHubMessage(m.PONG_STATE,s)):this._sendToPeer(this.lobbyId,x(m.PONG_STATE,s))}startArena(e){if(!this.isHub)return;const t=this._createHubMessage(m.ARENA_START,e);this._broadcastFromHub(t),this._emit("arena-start",t.payload)}broadcastArenaState(e){if(!this.isHub)return;const t=this._createHubMessage(m.ARENA_STATE,e);this._broadcastFromHub(t),this._emit("arena-state",t.payload)}sendArenaInput(e){const t=x(m.ARENA_INPUT,{from:this.myId,...e});this.isHub?this._emit("arena-input",{...e,from:this.myId}):this._sendToPeer(this.lobbyId,t)}sendArenaShoot(e){const t=x(m.ARENA_SHOOT,{from:this.myId,...e});this.isHub?this._emit("arena-shoot",{...e,from:this.myId}):this._sendToPeer(this.lobbyId,t)}broadcastArenaHit(e){if(!this.isHub)return;const t=this._createHubMessage(m.ARENA_HIT,e);this._broadcastFromHub(t),this._emit("arena-hit",t.payload)}broadcastArenaEnd(e){if(!this.isHub)return;const t=this._createHubMessage(m.ARENA_END,e);this._broadcastFromHub(t),this._emit("arena-end",t.payload)}getUserList(){const e=[];let t=!1;for(const[s,r]of this.users)s===this.myId&&(t=!0),e.push({id:r.id,username:r.username,color:r.color,isHub:r.isHub,number:r.number});return!t&&this.myUser&&e.push({id:this.myUser.id,username:this.myUser.username,color:this.myUser.color,isHub:this.myUser.isHub,number:this.myUser.number}),e.sort((s,r)=>s.isHub&&!r.isHub?-1:!s.isHub&&r.isHub?1:(s.number||0)-(r.number||0))}goOffline(){this.peer&&!this.peer.destroyed&&(this.isHub?this.myUser._offline=!0:this.peer.disconnect())}goOnline(){this.peer&&this.peer.disconnected&&this.peer.reconnect(),this.myUser._offline=!1}destroy(){if(this._destroyed=!0,this.peer){if(!this.isHub)try{this._sendToPeer(this.lobbyId,x(m.LEAVE,{id:this.myId,username:this.myUser.username}))}catch{}this.peer.destroy()}this.connections.clear(),this.users.clear(),this.listeners.clear()}}const Nt="reveal-peerjs-settings",Bt={username:"",color:"#4fc3f7",darkMode:!1,highContrast:!1,goOffline:!1};function Rs(){try{const n=localStorage.getItem(Nt);if(n)return{...Bt,...JSON.parse(n)}}catch{}return{...Bt}}function Ft(n){try{localStorage.setItem(Nt,JSON.stringify(n))}catch{}}const Le="reveal-peerjs-styles";function Ms(){if(document.getElementById(Le))return;const n=document.createElement("style");n.id=Le,n.textContent=`
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

    .rpjs-toolbar button:focus-visible,
    .rpjs-send-btn:focus-visible,
    .rpjs-target-btn:focus-visible,
    .rpjs-lobby-close:focus-visible,
    .rpjs-modal-close:focus-visible,
    .rpjs-save-btn:focus-visible,
    .rpjs-hub-menu-item:focus-visible,
    .rpjs-poll-vote-option:focus-visible,
    .rpjs-arena-exit:focus-visible,
    .rpjs-arena-shoot-btn:focus-visible {
      outline: 2px solid rgba(97, 218, 251, 0.95);
      outline-offset: 2px;
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
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
      font-family: inherit;
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

    .rpjs-poll-options-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
    }

    .rpjs-poll-option-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.72);
    }

    .rpjs-poll-select {
      min-width: 130px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 6px;
      color: #f4f4f4;
      padding: 6px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
    }

    .rpjs-poll-select:focus {
      border-color: rgba(255, 167, 38, 0.45);
    }

    .rpjs-poll-check-option {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.72);
      cursor: pointer;
      user-select: none;
    }

    .rpjs-poll-check-option input {
      accent-color: #ffa726;
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

    .rpjs-poll-vote-meta {
      font-size: 11px;
      letter-spacing: 0.02em;
      color: rgba(255, 255, 255, 0.48);
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .rpjs-poll-vote-question {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #fff;
      line-height: 1.35;
    }

    .rpjs-poll-vote-hint {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.58);
      margin-bottom: 12px;
    }

    .rpjs-poll-vote-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .rpjs-poll-vote-option {
      display: flex;
      align-items: center;
      gap: 10px;
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

    .rpjs-poll-vote-option:hover,
    .rpjs-poll-vote-option.rpjs-selected {
      background: rgba(255, 167, 38, 0.15);
      border-color: rgba(255, 167, 38, 0.35);
    }

    .rpjs-poll-vote-option-marker {
      width: 18px;
      flex: 0 0 18px;
      color: #ffa726;
      text-align: center;
    }

    .rpjs-poll-submit-vote {
      width: 100%;
      padding: 10px;
      margin-bottom: 14px;
      background: rgba(255, 167, 38, 0.55);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
    }

    .rpjs-poll-submit-vote:disabled {
      cursor: not-allowed;
      opacity: 0.45;
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
      width: 430px;
      max-width: 92vw;
    }

    .rpjs-poll-results-question {
      margin-bottom: 6px;
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.35;
    }

    .rpjs-poll-results-summary {
      margin-bottom: 14px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.48);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .rpjs-poll-results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .rpjs-poll-result-row {
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.035);
    }

    .rpjs-poll-result-row[data-leading="true"] {
      border-color: rgba(255, 167, 38, 0.34);
      background: rgba(255, 167, 38, 0.08);
    }

    .rpjs-poll-result-heading {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .rpjs-poll-result-rank {
      color: #ffa726;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .rpjs-poll-result-text {
      color: rgba(255, 255, 255, 0.9);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .rpjs-poll-result-winner {
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(255, 167, 38, 0.2);
      color: #ffcc80;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .rpjs-poll-result-meta {
      margin-bottom: 6px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    }

    .rpjs-poll-result-bar-bg {
      width: 100%;
      height: 9px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
    }

    .rpjs-poll-result-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffa726, #ff7043);
      border-radius: 999px;
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
      background: rgba(4, 7, 12, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 6px 12px;
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
      background: rgba(4, 8, 14, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.86);
      pointer-events: none;
      min-width: 140px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.34);
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

    .rpjs-arena-scoreboard-hp {
      letter-spacing: 0.2px;
      font-variant-numeric: tabular-nums;
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
  `,document.head.appendChild(n)}function ws(){const n=document.getElementById(Le);n&&n.remove()}const Wt='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',Is='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',Ls='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m-7.5-3.5l4.24-4.24m4.52-4.52L17.5 4.5M1 12h6m6 0h6m-3.5 7.5l-4.24-4.24M8.76 10.76 4.5 6.5"></path></svg>',As='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',fe='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',Ds='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',$s='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',Os='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>',Hs='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><line x1="4" y1="4" x2="4" y2="20"></line><line x1="20" y1="4" x2="20" y2="20"></line></svg>',qt='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',zs='<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',Us='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>';class Ns{constructor(e,t){this.network=e,this.settings=t,this.el=null,this.chatTarget=null,this._dropdownOpen=!1,this._contextMenu=null,this._onContextMenu=null,this._outsideClickHandler=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-lobby-panel",this.el.innerHTML=`
      <div class="rpjs-lobby-header">
        <span>Lobby</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="rpjs-status-dot" id="rpjs-status-dot"></span>
          <button class="rpjs-lobby-close" id="rpjs-lobby-close" type="button" aria-label="Close lobby panel">${fe}</button>
        </div>
      </div>
      <div class="rpjs-resize-handle" id="rpjs-resize-handle" title="Drag to resize"></div>
      <div class="rpjs-users-section" id="rpjs-users-list"></div>
      <div class="rpjs-chat-section" id="rpjs-chat-messages"></div>
      <div class="rpjs-chat-input-area">
        <div class="rpjs-target-dropdown">
          <button class="rpjs-target-btn ${this.chatTarget?"rpjs-private-active":""}" id="rpjs-target-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
            ${this.chatTarget?this._getTargetName():"Lobby"} ${qt}
          </button>
          <div class="rpjs-target-dropdown-list" id="rpjs-target-dropdown" role="listbox" aria-label="Message target"></div>
        </div>
        <input type="text" class="rpjs-chat-input" id="rpjs-chat-input" placeholder="Type a message..." autocomplete="off" aria-label="Chat message">
        <button class="rpjs-send-btn" id="rpjs-send-btn" type="button" aria-label="Send message">${As}</button>
      </div>
    `,document.body.appendChild(this.el),this._bindEvents(),this.updateUsers(),this.updateChat()}_getTargetName(){if(!this.chatTarget)return"Lobby";const t=this.network.getUserList().find(s=>s.id===this.chatTarget);return t?t.username:"Lobby"}_bindEvents(){this.el.querySelector("#rpjs-lobby-close").addEventListener("click",()=>{this.hide()});const e=this.el.querySelector(".rpjs-lobby-header");this._bindDragEvents(e);const t=this.el.querySelector("#rpjs-resize-handle");t&&this._bindResizeEvents(t);const s=this.el.querySelector("#rpjs-chat-input");s.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),this._sendMessage())}),this.el.querySelector("#rpjs-send-btn").addEventListener("click",()=>{this._sendMessage()}),this.el.querySelector("#rpjs-target-btn").addEventListener("click",r=>{r.stopPropagation(),this._toggleDropdown()}),this._outsideClickHandler=()=>{this._closeDropdown()},document.addEventListener("click",this._outsideClickHandler),setTimeout(()=>s.focus(),100)}_bindDragEvents(e){let t=!1,s,r,i,o;const a=d=>{if(d.target.closest("button"))return;t=!0,s=d.clientX,r=d.clientY;const h=this.el.getBoundingClientRect();i=h.left,o=h.top,this.el.style.bottom="auto",this.el.style.top=o+"px",this.el.style.left=i+"px",document.addEventListener("mousemove",c),document.addEventListener("mouseup",l),d.preventDefault()},c=d=>{if(!t)return;let h=i+(d.clientX-s),f=o+(d.clientY-r);h=Math.max(0,Math.min(window.innerWidth-60,h)),f=Math.max(0,Math.min(window.innerHeight-60,f)),this.el.style.left=h+"px",this.el.style.top=f+"px"},l=()=>{t=!1,document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",l)};e.addEventListener("mousedown",a);let p=null;e.addEventListener("touchstart",d=>{if(d.target.closest("button"))return;const h=d.changedTouches[0];p=h.identifier,s=h.clientX,r=h.clientY;const f=this.el.getBoundingClientRect();i=f.left,o=f.top,this.el.style.bottom="auto",this.el.style.top=o+"px",this.el.style.left=i+"px",d.preventDefault()},{passive:!1}),e.addEventListener("touchmove",d=>{for(const h of d.changedTouches){if(h.identifier!==p)continue;let f=i+(h.clientX-s),b=o+(h.clientY-r);f=Math.max(0,Math.min(window.innerWidth-60,f)),b=Math.max(0,Math.min(window.innerHeight-60,b)),this.el.style.left=f+"px",this.el.style.top=b+"px"}d.preventDefault()},{passive:!1}),e.addEventListener("touchend",()=>{p=null})}_bindResizeEvents(e){let t=!1,s,r,i,o;const a=p=>{t=!0,s=p.clientX,r=p.clientY,i=this.el.offsetWidth,o=this.el.offsetHeight,document.addEventListener("mousemove",c),document.addEventListener("mouseup",l),p.preventDefault()},c=p=>{if(!t)return;const d=p.clientX-s,h=p.clientY-r;let f=i+d,b=o-h;f=Math.max(280,Math.min(600,f)),b=Math.max(300,Math.min(window.innerHeight*.8,b)),this.el.style.width=f+"px",this.el.style.height=b+"px"},l=()=>{t=!1,document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",l)};e.addEventListener("mousedown",a)}_sendMessage(){const e=this.el.querySelector("#rpjs-chat-input"),t=e.value.trim();t&&(this.network.sendChat(t,this.chatTarget),e.value="",e.focus())}_toggleDropdown(){this._dropdownOpen=!this._dropdownOpen;const e=this.el.querySelector("#rpjs-target-dropdown"),t=this.el.querySelector("#rpjs-target-btn");this._dropdownOpen?(this._renderDropdownItems(),e.classList.add("rpjs-open"),t&&t.setAttribute("aria-expanded","true")):(e.classList.remove("rpjs-open"),t&&t.setAttribute("aria-expanded","false"))}_closeDropdown(){var s,r;this._dropdownOpen=!1;const e=(s=this.el)==null?void 0:s.querySelector("#rpjs-target-dropdown");e&&e.classList.remove("rpjs-open");const t=(r=this.el)==null?void 0:r.querySelector("#rpjs-target-btn");t&&t.setAttribute("aria-expanded","false")}_renderDropdownItems(){const e=this.el.querySelector("#rpjs-target-dropdown"),t=this.network.getUserList(),s=this.network.myId;let r=`
      <div class="rpjs-target-dropdown-item" role="option" data-target="">
        <span style="color:rgba(255,255,255,0.5)">${zs}</span>
        <span>Lobby (Everyone)</span>
      </div>
    `;for(const i of t)i.id!==s&&(r+=`
        <div class="rpjs-target-dropdown-item" role="option" data-target="${i.id}">
          <span class="rpjs-user-dot" style="background:${i.color}"></span>
          <span>${i.username}${i.isHub?" [Hub]":""}</span>
        </div>
      `);e.innerHTML=r,e.querySelectorAll(".rpjs-target-dropdown-item").forEach(i=>{i.addEventListener("click",o=>{o.stopPropagation();const a=i.getAttribute("data-target")||null;this.setChatTarget(a),this._closeDropdown()})})}setChatTarget(e){var s;this.chatTarget=e;const t=(s=this.el)==null?void 0:s.querySelector("#rpjs-target-btn");t&&(t.className=`rpjs-target-btn ${e?"rpjs-private-active":""}`,t.innerHTML=`${e?this._getTargetName():"Lobby"} ${qt}`)}updateUsers(){var r;const e=(r=this.el)==null?void 0:r.querySelector("#rpjs-users-list");if(!e)return;const t=this.network.getUserList(),s=this.network.myId;e.innerHTML=t.map(i=>`
      <div class="rpjs-user-item" data-peer-id="${i.id}" title="Left-click to set as private message target. Right-click for more options.">
        <span class="rpjs-user-dot" style="background:${i.color}"></span>
        <span class="rpjs-user-name" style="color:${i.color}">${i.username}</span>
        ${i.isHub?'<span class="rpjs-user-hub-tag">HUB</span>':""}
        ${i.id===s?'<span class="rpjs-user-self-tag">YOU</span>':""}
      </div>
    `).join(""),e.querySelectorAll(".rpjs-user-item").forEach(i=>{i.addEventListener("click",()=>{const o=i.getAttribute("data-peer-id");o!==s&&this.setChatTarget(o)}),i.addEventListener("contextmenu",o=>{o.preventDefault();const a=i.getAttribute("data-peer-id");a!==s&&this._showContextMenu(o,a)})})}_showContextMenu(e,t){this._hideContextMenu();const r=this.network.getUserList().find(c=>c.id===t);if(!r)return;const i=document.createElement("div");i.className="rpjs-context-menu",i.style.left=`${e.clientX}px`,i.style.top=`${e.clientY}px`,i.innerHTML=`
      <div class="rpjs-context-menu-item" data-action="private">
        <span style="color:#ce93d8">${Wt}</span>
        <span>Private Message</span>
      </div>
      <div class="rpjs-context-menu-item" data-action="pong">
        <span style="color:#4fc3f7">${Hs}</span>
        <span>Challenge to Pong</span>
      </div>
    `,document.body.appendChild(i),this._contextMenu=i;const o=i.getBoundingClientRect();o.right>window.innerWidth&&(i.style.left=`${window.innerWidth-o.width-8}px`),o.bottom>window.innerHeight&&(i.style.top=`${window.innerHeight-o.height-8}px`),i.querySelectorAll(".rpjs-context-menu-item").forEach(c=>{c.addEventListener("click",()=>{const l=c.getAttribute("data-action");l==="private"?this.setChatTarget(t):l==="pong"&&(this.network.sendPongInvite(t),this._addSystemMessage(`Pong challenge sent to ${r.username}!`)),this._hideContextMenu()})});const a=c=>{i.contains(c.target)||(this._hideContextMenu(),document.removeEventListener("click",a))};setTimeout(()=>document.addEventListener("click",a),0)}_hideContextMenu(){this._contextMenu&&(this._contextMenu.remove(),this._contextMenu=null)}_addSystemMessage(e){var r;const t=(r=this.el)==null?void 0:r.querySelector("#rpjs-chat-messages");if(!t)return;const s=document.createElement("div");s.className="rpjs-chat-msg rpjs-chat-system",s.textContent=e,t.appendChild(s),t.scrollTop=t.scrollHeight}updateChat(){var s;const e=(s=this.el)==null?void 0:s.querySelector("#rpjs-chat-messages");if(!e)return;const t=this.network.chatMessages;e.innerHTML=t.map(r=>r.private?`<div class="rpjs-chat-msg rpjs-chat-msg-private">
          <span class="rpjs-chat-private-label">[PM]</span>
          <span class="rpjs-chat-username" style="color:${r.color||"#ce93d8"}">${r.username}</span>
          <span class="rpjs-chat-text">${this._escapeHtml(r.text)}</span>
        </div>`:`<div class="rpjs-chat-msg">
        <span class="rpjs-chat-username" style="color:${r.color||"#4fc3f7"}">${r.username}</span>
        <span class="rpjs-chat-text">${this._escapeHtml(r.text)}</span>
      </div>`).join(""),e.scrollTop=e.scrollHeight}addChatMessage(e){var r;const t=(r=this.el)==null?void 0:r.querySelector("#rpjs-chat-messages");if(!t)return;const s=document.createElement("div");s.className=`rpjs-chat-msg ${e.private?"rpjs-chat-msg-private":""}`,s.innerHTML=`
      ${e.private?'<span class="rpjs-chat-private-label">[PM]</span>':""}
      <span class="rpjs-chat-username" style="color:${e.color||"#4fc3f7"}">${this._escapeHtml(e.username)}</span>
      <span class="rpjs-chat-text">${this._escapeHtml(e.text)}</span>
    `,t.appendChild(s),t.scrollTop=t.scrollHeight}_escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}show(){this.el||this.render(),this.el.style.display="flex"}hide(){this.el&&(this.el.style.display="none")}toggle(){this.el&&this.el.style.display!=="none"?this.hide():this.show()}isVisible(){return this.el&&this.el.style.display!=="none"}destroy(){this._outsideClickHandler&&(document.removeEventListener("click",this._outsideClickHandler),this._outsideClickHandler=null),this._hideContextMenu(),this.el&&(this.el.remove(),this.el=null)}}class Bs{constructor(e,t,s){this.network=e,this.settings={...t},this.onSettingsChange=s,this.el=null,this._keyHandler=null}render(){this.el&&this.el.remove();const e=document.createElement("div");e.className="rpjs-modal-overlay",e.innerHTML=`
      <div class="rpjs-modal">
        <div class="rpjs-modal-title">
          <span>Settings</span>
          <button class="rpjs-modal-close" id="rpjs-settings-close" type="button" aria-label="Close settings">${fe}</button>
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
                    id="rpjs-toggle-offline" type="button" role="switch"
                    aria-label="Go Offline"
                    aria-checked="${this.settings.goOffline}"></button>
          </div>
        </div>

        <div class="rpjs-field">
          <div class="rpjs-toggle-row">
            <span class="rpjs-toggle-label">Dark Mode</span>
            <button class="rpjs-toggle ${this.settings.darkMode?"rpjs-active":""}"
                    id="rpjs-toggle-darkmode" type="button" role="switch"
                    aria-label="Dark Mode"
                    aria-checked="${this.settings.darkMode}"></button>
          </div>
        </div>

        <div class="rpjs-field">
          <div class="rpjs-toggle-row">
            <span class="rpjs-toggle-label">High Contrast / Assisted Visuals</span>
            <button class="rpjs-toggle ${this.settings.highContrast?"rpjs-active":""}"
                    id="rpjs-toggle-highcontrast" type="button" role="switch"
                    aria-label="High Contrast / Assisted Visuals"
                    aria-checked="${this.settings.highContrast}"></button>
          </div>
        </div>

        <button class="rpjs-save-btn" id="rpjs-settings-save" type="button">Save & Apply</button>
      </div>
    `,document.body.appendChild(e),this.el=e,this._bindEvents()}_bindEvents(){this.el.querySelector("#rpjs-settings-close").addEventListener("click",()=>{this.close()}),this.el.addEventListener("click",s=>{s.target===this.el&&this.close()}),this._keyHandler=s=>{s.key==="Escape"&&this.close()},document.addEventListener("keydown",this._keyHandler);const e=this.el.querySelector("#rpjs-settings-color-picker"),t=this.el.querySelector("#rpjs-settings-color-hex");e.addEventListener("input",()=>{t.value=e.value}),t.addEventListener("input",()=>{/^#[0-9a-fA-F]{6}$/.test(t.value)&&(e.value=t.value)}),this._bindToggle("rpjs-toggle-offline","goOffline",s=>{s?this.network.goOffline():this.network.goOnline()}),this._bindToggle("rpjs-toggle-darkmode","darkMode",s=>{document.body.classList.toggle("rpjs-dark-mode",s)}),this._bindToggle("rpjs-toggle-highcontrast","highContrast",s=>{document.body.classList.toggle("rpjs-high-contrast",s)}),this.el.querySelector("#rpjs-settings-save").addEventListener("click",()=>{this._save()})}_bindToggle(e,t,s){const r=this.el.querySelector(`#${e}`);r.addEventListener("click",()=>{this.settings[t]=!this.settings[t],r.classList.toggle("rpjs-active",this.settings[t]),r.setAttribute("aria-checked",this.settings[t]),s&&s(this.settings[t])})}_save(){const e=this.el.querySelector("#rpjs-settings-username").value.trim(),t=this.el.querySelector("#rpjs-settings-color-hex").value.trim();e&&(this.settings.username=e),/^#[0-9a-fA-F]{6}$/.test(t)&&(this.settings.color=t),Ft(this.settings),this.network.updateProfile(this.settings.username,this.settings.color),this.onSettingsChange&&this.onSettingsChange(this.settings),this.close()}_escapeAttr(e){return e.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}show(){this.render()}close(){this._keyHandler&&(document.removeEventListener("keydown",this._keyHandler),this._keyHandler=null),this.el&&(this.el.remove(),this.el=null)}destroy(){this.close()}}class Fs{constructor(e,t,s){this.network=e,this.deck=t,this.onLaunchArena=s,this.el=null,this.followActive=!1,this._pollModal=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-hub-menu",this.el.innerHTML=`
      <div class="rpjs-hub-menu-title">Hub Controls</div>
      <button class="rpjs-hub-menu-item" id="rpjs-hub-jump" type="button">
        <span class="rpjs-hub-menu-icon">${Ds}</span>
        <span class="rpjs-hub-menu-label">Jump All to Current Slide</span>
      </button>
      <button class="rpjs-hub-menu-item" id="rpjs-hub-follow" type="button" aria-pressed="${this.followActive?"true":"false"}">
        <span class="rpjs-hub-menu-icon">${$s}</span>
        <span class="rpjs-hub-menu-label">Follow Mode</span>
        <span class="rpjs-hub-menu-status ${this.followActive?"rpjs-on":""}" id="rpjs-follow-status">
          ${this.followActive?"ON":"OFF"}
        </span>
      </button>
      <button class="rpjs-hub-menu-item" id="rpjs-hub-poll" type="button">
        <span class="rpjs-hub-menu-icon">${Os}</span>
        <span class="rpjs-hub-menu-label">Launch Poll</span>
      </button>
      <button class="rpjs-hub-menu-item" id="rpjs-hub-arena" type="button">
        <span class="rpjs-hub-menu-icon">${Us}</span>
        <span class="rpjs-hub-menu-label">Launch Arena</span>
      </button>
    `,document.body.appendChild(this.el),this._bindEvents()}_bindEvents(){this.el.querySelector("#rpjs-hub-jump").addEventListener("click",()=>{const e=this.deck.getIndices();this.network.jumpAllToSlide(e.h,e.v),this._flashItem("rpjs-hub-jump")}),this.el.querySelector("#rpjs-hub-follow").addEventListener("click",()=>{this.followActive=!this.followActive,this.network.setFollowMode(this.followActive);const e=this.el.querySelector("#rpjs-follow-status");e.textContent=this.followActive?"ON":"OFF",e.className=`rpjs-hub-menu-status ${this.followActive?"rpjs-on":""}`;const t=this.el.querySelector("#rpjs-hub-follow");t.classList.toggle("rpjs-active-feature",this.followActive),t.setAttribute("aria-pressed",this.followActive?"true":"false")}),this.el.querySelector("#rpjs-hub-poll").addEventListener("click",()=>{this._showPollCreator()}),this.el.querySelector("#rpjs-hub-arena").addEventListener("click",()=>{this.onLaunchArena&&this.onLaunchArena(),this.hide()})}_flashItem(e){const t=this.el.querySelector(`#${e}`);t&&(t.style.background="rgba(255, 167, 38, 0.2)",setTimeout(()=>{t.style.background=""},300))}_showPollCreator(){this._closePollModal();const e=document.createElement("div");e.className="rpjs-modal-overlay";const t=["",""],s=i=>i.map((o,a)=>`
        <div class="rpjs-poll-answer-row">
          <input type="text" class="rpjs-poll-answer-input"
                 data-index="${a}" placeholder="Answer ${a+1}" value="${this._escapeAttr(o)}">
          ${i.length>2?`<button class="rpjs-poll-remove-btn" data-remove="${a}" aria-label="Remove answer ${a+1}">&times;</button>`:""}
        </div>
      `).join("");e.innerHTML=`
      <div class="rpjs-modal rpjs-poll-modal">
        <div class="rpjs-modal-title">
          <span>Create Poll</span>
          <button class="rpjs-modal-close" id="rpjs-poll-close" type="button" aria-label="Close poll creator">${fe}</button>
        </div>
        <input type="text" class="rpjs-poll-question-input" id="rpjs-poll-question"
               placeholder="Enter your question..." maxlength="200">
        <div class="rpjs-poll-answers" id="rpjs-poll-answers">
          ${s(t)}
        </div>
        <button class="rpjs-poll-add-btn" id="rpjs-poll-add-answer" type="button">+ Add Answer</button>
        <div class="rpjs-poll-options-panel" aria-label="Poll options">
          <label class="rpjs-poll-option-field" for="rpjs-poll-timeout">
            <span>Voting time</span>
            <select id="rpjs-poll-timeout" class="rpjs-poll-select">
              <option value="10">10 seconds</option>
              <option value="20">20 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </label>
          <label class="rpjs-poll-check-option">
            <input type="checkbox" id="rpjs-poll-mode-multiple">
            <span>Allow multiple answers</span>
          </label>
          <label class="rpjs-poll-check-option">
            <input type="checkbox" id="rpjs-poll-share-results" checked>
            <span>Share results with visitors</span>
          </label>
        </div>
        <button class="rpjs-poll-publish-btn" id="rpjs-poll-publish" type="button">Publish Poll</button>
      </div>
    `,document.body.appendChild(e),this._pollModal=e,e.querySelector("#rpjs-poll-close").addEventListener("click",()=>{this._closePollModal()}),e.addEventListener("click",i=>{i.target===e&&this._closePollModal()});const r=()=>{e.querySelectorAll(".rpjs-poll-answer-input").forEach(o=>{const a=parseInt(o.getAttribute("data-index"));isNaN(a)||(t[a]=o.value)})};e.addEventListener("click",i=>{if(i.target.classList.contains("rpjs-poll-remove-btn")){r();const o=parseInt(i.target.getAttribute("data-remove"));t.splice(o,1),e.querySelector(".rpjs-poll-answers").innerHTML=s(t)}}),e.querySelector("#rpjs-poll-add-answer").addEventListener("click",()=>{r(),t.length<8&&(t.push(""),e.querySelector(".rpjs-poll-answers").innerHTML=s(t))}),e.querySelector("#rpjs-poll-publish").addEventListener("click",()=>{r();const i=e.querySelector("#rpjs-poll-question").value.trim(),o=t.map(h=>h.trim()).filter(h=>h),a=parseInt(e.querySelector("#rpjs-poll-timeout").value,10)||10,c=e.querySelector("#rpjs-poll-mode-multiple").checked?"multiple":"single",l=e.querySelector("#rpjs-poll-share-results").checked;if(!i||o.length<2)return;const d={pollId:`poll-${Date.now()}`,question:i,answers:o,fromUsername:this.network.myUser.username,timeout:a,mode:c,shareResults:l};this.network.startPoll(d),this._startPollCollector(d),this._closePollModal()})}_startPollCollector(e){const t=new Map;let s=e.timeout;const r=setInterval(()=>{s--,s<=0&&(clearInterval(r),this._showPollResults(e,t))},1e3),i=o=>{o.pollId===e.pollId&&t.set(o.from,o.answer)};this.network.on("poll-answer",i),setTimeout(()=>{this.network.off("poll-answer",i)},(e.timeout+2)*1e3)}_showPollResults(e,t){const s=this._buildPollResults(e,t);e.shareResults!==!1&&this.network.sendPollResults(s),this._renderPollResults(s)}_buildPollResults(e,t){var l;const s=new Map(e.answers.map(p=>[p,0]));let r=0;for(const[,p]of t){const d=Array.isArray(p)?p:[p],h=[...new Set(d.map(f=>String(f).trim()).filter(Boolean))];for(const f of h)s.has(f)&&(s.set(f,s.get(f)+1),r++)}const i=t.size,o=Math.max(1,i),a=e.answers.map((p,d)=>({text:p,index:d,count:s.get(p)||0})).sort((p,d)=>d.count-p.count||p.index-d.index),c=((l=a[0])==null?void 0:l.count)||0;return{pollId:e.pollId,question:e.question,mode:e.mode||"single",shareResults:e.shareResults!==!1,totalResponses:i,totalSelections:r,answers:a.map((p,d)=>({text:p.text,count:p.count,percentage:Math.round(p.count/o*100),rank:d+1,isWinner:c>0&&p.count===c}))}}_renderPollResults(e){const t=document.createElement("div");t.className="rpjs-modal-overlay";const s=e.totalResponses||0,r=e.totalSelections??e.answers.reduce((a,c)=>a+(c.count||0),0),i=e.mode||"single",o=[`${s} voter${s===1?"":"s"}`,`${r} selection${r===1?"":"s"}`];i==="multiple"&&o.push("multiple choice"),t.innerHTML=`
      <div class="rpjs-modal rpjs-poll-results-card" role="dialog" aria-label="Poll results">
        <div class="rpjs-modal-title">
          <span>Poll Results</span>
          <button class="rpjs-modal-close" id="rpjs-results-close" type="button" aria-label="Close poll results">${fe}</button>
        </div>
        <div class="rpjs-poll-results-question">${this._escapeHtml(e.question)}</div>
        <div class="rpjs-poll-results-summary">${o.join(" · ")}</div>
        <div class="rpjs-poll-results-list">
          ${e.answers.map((a,c)=>this._renderPollResultRow(a,c)).join("")}
        </div>
      </div>
    `,document.body.appendChild(t),t.querySelector("#rpjs-results-close").addEventListener("click",()=>{t.remove()}),t.addEventListener("click",a=>{a.target===t&&t.remove()})}_renderPollResultRow(e,t){const s=e.count||0,r=Math.max(0,Math.min(100,e.percentage||0)),i=e.rank||t+1,o=!!e.isWinner;return`
      <div class="rpjs-poll-result-row" data-leading="${o?"true":"false"}">
        <div class="rpjs-poll-result-heading">
          <span class="rpjs-poll-result-rank">#${i}</span>
          <span class="rpjs-poll-result-text">${this._escapeHtml(e.text)}</span>
          ${o?'<span class="rpjs-poll-result-winner">Top choice</span>':""}
        </div>
        <div class="rpjs-poll-result-meta">${s} vote${s===1?"":"s"} · ${r}%</div>
        <div class="rpjs-poll-result-bar-bg" role="presentation">
          <div class="rpjs-poll-result-bar-fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r}" style="width:${r}%"></div>
        </div>
      </div>
    `}_closePollModal(){this._pollModal&&(this._pollModal.remove(),this._pollModal=null)}_escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}_escapeAttr(e){return e.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}show(){this.el||this.render(),this.el.style.display="block"}hide(){this.el&&(this.el.style.display="none")}toggle(){this.el&&this.el.style.display!=="none"?this.hide():this.show()}destroy(){this._closePollModal(),this.el&&(this.el.remove(),this.el=null)}}class Yt{constructor(e,t=!0,s=null,{onStart:r,onStop:i}={}){this.network=e,this.isInitiator=t,this.opponentPeerId=s,this._onStartCb=r||null,this._onStopCb=i||null,this.el=null,this.canvas=null,this.ctx=null,this.running=!1,this.animFrame=null,this.W=0,this.H=0,this.PADDLE_W=12,this.PADDLE_H=80,this.BALL_R=8,this.PADDLE_MARGIN=20,this.leftY=0,this.rightY=0,this.mouseY=0,this.ball={x:0,y:0,vx:0,vy:0},this.scoreLeft=0,this.scoreRight=0,this.baseSpeed=4,this.currentSpeed=4,this.hitCount=0,this._onPongMove=null,this._onPongState=null,this._onPongAccept=null,this._onPongDecline=null}render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-pong-overlay",this.el.innerHTML=`
      <canvas class="rpjs-pong-canvas" id="rpjs-pong-canvas"></canvas>
      <div class="rpjs-pong-hud">
        <span class="rpjs-pong-score" id="rpjs-pong-left-score">0</span>
        <span class="rpjs-pong-divider">:</span>
        <span class="rpjs-pong-score" id="rpjs-pong-right-score">0</span>
      </div>
      <div class="rpjs-pong-players" id="rpjs-pong-players"></div>
      <button class="rpjs-pong-exit" id="rpjs-pong-exit">Exit [Esc]</button>
    `,document.body.appendChild(this.el),this.canvas=this.el.querySelector("#rpjs-pong-canvas"),this.ctx=this.canvas.getContext("2d"),this._resize(),this._resetBall(),this._bindEvents(),this._updatePlayerNames(),this._onPongMove=e=>{if(e.from===this.opponentPeerId){const t=e.y*this.H;this.isInitiator?this.rightY=t:this.leftY=t}},this.network.on("pong-move",this._onPongMove),this._onPongState=e=>{e.from===this.opponentPeerId&&(e.to&&e.to!==this.network.myId||this._applyState(e.state))},this.network.on("pong-state",this._onPongState)}_updatePlayerNames(){const t=this.network.getUserList().find(o=>o.id===this.opponentPeerId),s=this.network.myUser.username,r=t?t.username:"Opponent",i=this.el.querySelector("#rpjs-pong-players");this.isInitiator?i.innerHTML=`<span style="color:${this.network.myUser.color}">${s} (Left)</span> vs <span style="color:${(t==null?void 0:t.color)||"#fff"}">${r} (Right)</span>`:i.innerHTML=`<span style="color:${(t==null?void 0:t.color)||"#fff"}">${r} (Left)</span> vs <span style="color:${this.network.myUser.color}">${s} (Right)</span>`}_resize(){this.W=window.innerWidth,this.H=window.innerHeight,this.canvas.width=this.W,this.canvas.height=this.H,this.leftY=this.H/2,this.rightY=this.H/2}_resetBall(){this.ball.x=this.W/2,this.ball.y=this.H/2;const e=(Math.random()*.5-.25)*Math.PI,t=Math.random()>.5?1:-1;this.currentSpeed=this.baseSpeed,this.hitCount=0,this.ball.vx=Math.cos(e)*this.currentSpeed*t,this.ball.vy=Math.sin(e)*this.currentSpeed}_bindEvents(){this._mouseHandler=e=>{this.mouseY=e.clientY,this.isInitiator?this.leftY=this.mouseY:this.rightY=this.mouseY;const t=this.mouseY/this.H;this.network.sendPongMove(this.opponentPeerId,Math.max(0,Math.min(1,t)))},this.el.addEventListener("mousemove",this._mouseHandler),this._touchHandler=e=>{e.preventDefault();const t=e.touches[0];this.mouseY=t.clientY,this.isInitiator?this.leftY=this.mouseY:this.rightY=this.mouseY;const s=this.mouseY/this.H;this.network.sendPongMove(this.opponentPeerId,Math.max(0,Math.min(1,s)))},this.el.addEventListener("touchstart",this._touchHandler,{passive:!1}),this.el.addEventListener("touchmove",this._touchHandler,{passive:!1}),this.el.querySelector("#rpjs-pong-exit").addEventListener("click",()=>{this.stop()}),this._keyHandler=e=>{e.stopImmediatePropagation(),e.key==="Escape"&&this.stop()},document.addEventListener("keydown",this._keyHandler,!0),this._resizeHandler=()=>this._resize(),window.addEventListener("resize",this._resizeHandler)}start(){this.render(),this.running=!0,this._onStartCb&&this._onStartCb(),this._loop()}stop(){this.running=!1,this.animFrame&&(cancelAnimationFrame(this.animFrame),this.animFrame=null),this._onPongMove&&this.network.off("pong-move",this._onPongMove),this._onPongState&&this.network.off("pong-state",this._onPongState),document.removeEventListener("keydown",this._keyHandler,!0),window.removeEventListener("resize",this._resizeHandler),this.el&&(this.el.remove(),this.el=null),this._onStopCb&&this._onStopCb()}_loop(){this.running&&(this._update(),this._draw(),this.animFrame=requestAnimationFrame(()=>this._loop()))}_update(){if(!this.isInitiator)return;this.ball.x+=this.ball.vx,this.ball.y+=this.ball.vy,(this.ball.y-this.BALL_R<=0||this.ball.y+this.BALL_R>=this.H)&&(this.ball.vy*=-1,this.ball.y=Math.max(this.BALL_R,Math.min(this.H-this.BALL_R,this.ball.y)));const e=this.PADDLE_MARGIN;this.ball.x-this.BALL_R<=e+this.PADDLE_W&&this.ball.x-this.BALL_R>=e&&this.ball.y>=this.leftY-this.PADDLE_H/2&&this.ball.y<=this.leftY+this.PADDLE_H/2&&this._handlePaddleHit(1);const t=this.W-this.PADDLE_MARGIN-this.PADDLE_W;this.ball.x+this.BALL_R>=t&&this.ball.x+this.BALL_R<=t+this.PADDLE_W&&this.ball.y>=this.rightY-this.PADDLE_H/2&&this.ball.y<=this.rightY+this.PADDLE_H/2&&this._handlePaddleHit(-1),this.ball.x<0&&(this.scoreRight++,this._updateScore(),this.scoreRight>=10?this._gameOver("right"):this._resetBall()),this.ball.x>this.W&&(this.scoreLeft++,this._updateScore(),this.scoreLeft>=10?this._gameOver("left"):this._resetBall()),this._sendState()}_captureState(){return{ball:{...this.ball},leftY:this.leftY,rightY:this.rightY,scoreLeft:this.scoreLeft,scoreRight:this.scoreRight,currentSpeed:this.currentSpeed,hitCount:this.hitCount}}_applyState(e){e&&(e.ball&&(this.ball={...e.ball}),typeof e.leftY=="number"&&(this.leftY=e.leftY),typeof e.rightY=="number"&&(this.rightY=e.rightY),typeof e.scoreLeft=="number"&&(this.scoreLeft=e.scoreLeft),typeof e.scoreRight=="number"&&(this.scoreRight=e.scoreRight),typeof e.currentSpeed=="number"&&(this.currentSpeed=e.currentSpeed),typeof e.hitCount=="number"&&(this.hitCount=e.hitCount),this._updateScore())}_sendState(){!this.isInitiator||!this.opponentPeerId||!this.network.sendPongState||this.network.sendPongState(this.opponentPeerId,this._captureState())}_handlePaddleHit(e){this.hitCount++,this.currentSpeed=this.baseSpeed+this.hitCount*.3;const t=(Math.random()*.6-.3)*Math.PI;this.ball.vx=Math.cos(t)*this.currentSpeed*e,this.ball.vy=Math.sin(t)*this.currentSpeed}_draw(){const e=this.ctx;e.clearRect(0,0,this.W,this.H),e.setLineDash([8,8]),e.strokeStyle="rgba(255, 255, 255, 0.15)",e.lineWidth=2,e.beginPath(),e.moveTo(this.W/2,0),e.lineTo(this.W/2,this.H),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(79, 195, 247, 0.8)";const t=this.PADDLE_MARGIN;e.beginPath(),e.roundRect(t,this.leftY-this.PADDLE_H/2,this.PADDLE_W,this.PADDLE_H,4),e.fill(),e.fillStyle="rgba(255, 167, 38, 0.8)";const s=this.W-this.PADDLE_MARGIN-this.PADDLE_W;e.beginPath(),e.roundRect(s,this.rightY-this.PADDLE_H/2,this.PADDLE_W,this.PADDLE_H,4),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.9)",e.beginPath(),e.arc(this.ball.x,this.ball.y,this.BALL_R,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.15)",e.beginPath(),e.arc(this.ball.x,this.ball.y,this.BALL_R*2.5,0,Math.PI*2),e.fill()}_updateScore(){var s,r;const e=(s=this.el)==null?void 0:s.querySelector("#rpjs-pong-left-score"),t=(r=this.el)==null?void 0:r.querySelector("#rpjs-pong-right-score");e&&(e.textContent=this.scoreLeft),t&&(t.textContent=this.scoreRight)}_gameOver(e){this.running=!1;const s=e==="left"&&this.isInitiator||e==="right"&&!this.isInitiator?this.network.myUser.username:"Opponent",r=this.ctx;r.fillStyle="rgba(0, 0, 0, 0.5)",r.fillRect(0,0,this.W,this.H),r.fillStyle="#fff",r.font="bold 48px -apple-system, sans-serif",r.textAlign="center",r.fillText(`${s} Wins!`,this.W/2,this.H/2-20),r.font="20px -apple-system, sans-serif",r.fillStyle="rgba(255, 255, 255, 0.6)",r.fillText("Click or press any key to close",this.W/2,this.H/2+30);const i=()=>{this.stop()};this.el.addEventListener("click",i,{once:!0}),document.addEventListener("keydown",i,{once:!0})}}const _=14,Gt=22,Vt=3,Ws=5,Xt=8,Jt=8,Ae=8,qs=2,De=.12,Ys=.02,Kt=40,Gs=350,$e=18,Zt=40,Vs=140,Xs=_+4,Js=50,Ks=33,F=100,Qt=100,Zs=6,Qs=4500,me=12,en=_+me+2,tn=12e3,Oe={blaster:{bulletSpeed:8,damage:34,life:110,count:null,spread:null,cooldown:300},rapid:{bulletSpeed:9.5,damage:18,life:95,count:1,spread:0,cooldown:120},spread:{bulletSpeed:7.2,damage:15,life:100,count:7,spread:.09,cooldown:340},sniper:{bulletSpeed:14,damage:55,life:150,count:1,spread:.005,cooldown:650}},ge={heal:{kind:"heal",color:"#66bb6a",label:"HEAL",value:35},armor:{kind:"armor",color:"#42a5f5",label:"ARMOR",value:30},rapid:{kind:"weapon",color:"#ff7043",label:"RAPID",weapon:"rapid"},spread:{kind:"weapon",color:"#ab47bc",label:"SPREAD",weapon:"spread"},sniper:{kind:"weapon",color:"#ffee58",label:"SNIPER",weapon:"sniper"}};function M(n,e,t){return Math.max(e,Math.min(t,n))}function Q(n,e,t,s){return Math.sqrt((t-n)**2+(s-e)**2)}function sn(n,e){const{bullets:t,W:s,H:r,walls:i,sparks:o}=n;for(let a=t.length-1;a>=0;a--){const c=t[a];if(c.x+=c.vx,c.y+=c.vy,c.life--,c.x<-20||c.x>s+20||c.y<-20||c.y>r+20||c.life<=0){t.splice(a,1);continue}let l=!1;for(const p of i)if(e(c.x-c.vx,c.y-c.vy,c.x,c.y,p.x1,p.y1,p.x2,p.y2)){l=!0;break}l&&(o.push({x:c.x,y:c.y,life:6,color:c.color}),t.splice(a,1))}}function nn(n,e){const{bullets:t,players:s,hitFlashes:r,sparks:i}=n;for(let o=t.length-1;o>=0;o--){const a=t[o];for(const[c,l]of s){if(c===a.from||l.eliminated||Q(a.x,a.y,l.x,l.y)>=Xs)continue;const d=a.damage||25,h=Math.min(l.armor||0,Math.ceil(d*.6));l.armor=Math.max(0,(l.armor||0)-h),l.hp-=d-h,l.hp<=0&&(l.hp=0,l.eliminated=!0);const f={targetId:c,hp:l.hp,armor:l.armor,eliminated:l.eliminated,x:l.x,y:l.y,color:l.color};e(f),r.push({x:l.x,y:l.y,time:15,color:"#fff"}),i.push({x:a.x,y:a.y,life:8,color:a.color}),t.splice(o,1);break}}}function rn(n,e){if(n.items.length>=Zs)return;const t=Object.keys(ge),s=t[Math.floor(Math.random()*t.length)],r=80;for(let i=0;i<10;i++){const o=r+Math.random()*(n.W-r*2),a=r+Math.random()*(n.H-r*2);if(!(Array.from(n.players.values()).some(p=>!p.eliminated&&Q(o,a,p.x,p.y)<100)||n.walls.some(p=>e(p.x1,p.y1,p.x2,p.y2,o,a,me+4)))){n.items.push({id:`it-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type:s,x:o,y:a,ttl:800});return}}}function on(n,e){const t=ge[e.type];return t?t.kind==="heal"?(n.hp=M((n.hp||0)+t.value,0,F),`${n.username} picked HEAL`):t.kind==="armor"?(n.armor=M((n.armor||0)+t.value,0,Qt),`${n.username} picked ARMOR`):t.kind==="weapon"?(n.weapon=t.weapon,n.weaponUntil=Date.now()+tn,`${n.username} picked ${t.label}`):null:null}function an(n,e,t){const s=Date.now();s>=n.itemSpawnAt&&(rn(n,e),n.itemSpawnAt=s+Qs);for(let r=n.items.length-1;r>=0;r--){const i=n.items[r];if(i.ttl--,i.ttl<=0){n.items.splice(r,1);continue}for(const[,o]of n.players){if(o.eliminated||Q(i.x,i.y,o.x,o.y)>en)continue;const a=on(o,i);a&&t(a),n.items.splice(r,1);break}}}function cn(n){const e=n.speed||Xt;return{tailX:n.x-n.vx/e*Jt,tailY:n.y-n.vy/e*Jt}}function ln(n){let e=n;return function(){return e=e*1103515245+12345&2147483647,e/2147483647}}function be(n,e,t,s){return Math.sqrt((t-n)**2+(s-e)**2)}function pn(n,e,t,s,r,i,o,a){const c=(n-t)*(i-a)-(e-s)*(r-o);if(Math.abs(c)<1e-4)return!1;const l=((n-r)*(i-a)-(e-i)*(r-o))/c,p=-((n-t)*(e-i)-(e-s)*(n-r))/c;return l>=0&&l<=1&&p>=0&&p<=1}function es(n,e,t,s,r,i){const o=r-t,a=i-s,c=o*o+a*a;if(c<=.001)return be(n,e,t,s);let l=((n-t)*o+(e-s)*a)/c;l=Math.max(0,Math.min(1,l));const p=t+l*o,d=s+l*a;return be(n,e,p,d)}function dn(n,e,t){const s=n/2,r=e/2,i=Math.min(n,e)*.28,o=[];for(let a=0;a<t;a++){const c=Math.PI*2*a/Math.max(1,t);o.push({x:s+Math.cos(c)*i,y:r+Math.sin(c)*i})}return o}function hn(n,e,t){let i=0;for(let o=0;o<24;o++)for(let a=0;a<14;a++){const c=(o+.5)*(e/24),l=(a+.5)*(t/14);n.some(d=>es(c,l,d.x1,d.y1,d.x2,d.y2)<18)&&i++}return 1-i/(24*14)}function ts(n,e,t,s){const r=ln(t),i=Math.max(1,Math.min(8,s||1)),o=dn(n,e,i),a=72,c=Math.min(n,e)*.16,l=28;let p=[],d=-1/0;for(let h=0;h<l;h++){const f=[],b=[0,0,0,0];for(let S=0;S<$e;S++){let C=!1;for(let q=0;q<30;q++){const A=a+r()*(n-a*2),D=a+r()*(e-a*2),j=r()*Math.PI,$=(Zt+r()*(Vs-Zt))/2,I={x1:A-Math.cos(j)*$,y1:D-Math.sin(j)*$,x2:A+Math.cos(j)*$,y2:D+Math.sin(j)*$};if(be(A,D,n/2,e/2)<c||o.some(v=>es(v.x,v.y,I.x1,I.y1,I.x2,I.y2)<_+34)||f.some(v=>pn(I.x1,I.y1,I.x2,I.y2,v.x1,v.y1,v.x2,v.y2))||f.some(v=>be((v.x1+v.x2)/2,(v.y1+v.y2)/2,A,D)<42))continue;const Y=(A<n/2?0:1)+(D<e/2?0:2);if(!(b[Y]>=Math.ceil($e/3.2))){f.push(I),b[Y]++,C=!0;break}}if(!C)break}const u=hn(f,n,e),y=f.length*3+u*10;if(y>d&&(p=f,d=y),f.length>=$e*.9&&u>.72)return{walls:f,spawns:o}}return{walls:p,spawns:o}}const ss=new Set([" ","escape","h","j","k","l","w","a","s","d"]);function un(n){var e;n._keyDownHandler=t=>{const s=t.key.toLowerCase();ss.has(s)&&(t.preventDefault(),t.stopImmediatePropagation()),n.keysDown.add(s),s===" "&&n.running&&n._shoot(),s==="escape"&&n.stop()},n._keyUpHandler=t=>{const s=t.key.toLowerCase();ss.has(s)&&t.stopImmediatePropagation(),n.keysDown.delete(s)},n._mouseMoveHandler=t=>{n.mouseX=t.clientX,n.mouseY=t.clientY;const s=n.players.get(n.network.myId);s&&(s.angle=Math.atan2(n.mouseY-s.y,n.mouseX-s.x))},n._resizeHandler=()=>n._resize(),n._mouseDownHandler=t=>{t.button===0&&n.running&&n._shoot()},document.addEventListener("keydown",n._keyDownHandler,!0),document.addEventListener("keyup",n._keyUpHandler,!0),n.el.addEventListener("mousemove",n._mouseMoveHandler),n.canvas.addEventListener("mousedown",n._mouseDownHandler),window.addEventListener("resize",n._resizeHandler),(e=n.el.querySelector("#rpjs-arena-exit"))==null||e.addEventListener("click",()=>n.stop()),fn(n)}function fn(n){if(n._isTouchDevice="ontouchstart"in window||navigator.maxTouchPoints>0,!n._isTouchDevice)return;const e=n.el.querySelector("#rpjs-arena-joystick"),t=n.el.querySelector("#rpjs-arena-joystick-knob"),s=n.el.querySelector("#rpjs-arena-shoot-btn"),r=55,i=l=>{l.preventDefault();const p=l.changedTouches[0];n._joystickTouchId=p.identifier;const d=e.getBoundingClientRect();n._joystickCenter={x:d.left+d.width/2,y:d.top+d.height/2}},o=l=>{l.preventDefault();for(const p of l.changedTouches){if(p.identifier!==n._joystickTouchId)continue;const d=p.clientX-n._joystickCenter.x,h=p.clientY-n._joystickCenter.y,f=Math.sqrt(d*d+h*h);if(f>8){const b=Math.min(f,r);n.touchDx=d/f,n.touchDy=h/f,t.style.transform=`translate(calc(-50% + ${d/f*b}px), calc(-50% + ${h/f*b}px))`}else n.touchDx=0,n.touchDy=0,t.style.transform="translate(-50%, -50%)"}},a=l=>{for(const p of l.changedTouches)p.identifier===n._joystickTouchId&&(n._joystickTouchId=null,n.touchDx=0,n.touchDy=0,t.style.transform="translate(-50%, -50%)")};e.addEventListener("touchstart",i,{passive:!1}),e.addEventListener("touchmove",o,{passive:!1}),e.addEventListener("touchend",a),e.addEventListener("touchcancel",a),s.addEventListener("touchstart",l=>{l.preventDefault(),n._shoot();const p=n.players.get(n.network.myId),d=p?n._weaponConfigFor(p):Oe.blaster;n._shootTouchInterval=setInterval(()=>n._shoot(),d.cooldown+50)},{passive:!1});const c=()=>{n._shootTouchInterval&&(clearInterval(n._shootTouchInterval),n._shootTouchInterval=null)};s.addEventListener("touchend",c),s.addEventListener("touchcancel",c),n._canvasTouchHandler=l=>{l.preventDefault();for(const p of l.touches){if(p.identifier===n._joystickTouchId)continue;const d=document.elementFromPoint(p.clientX,p.clientY);if(d&&(d===s||e.contains(d)))continue;n.mouseX=p.clientX,n.mouseY=p.clientY;const h=n.players.get(n.network.myId);h&&(h.angle=Math.atan2(p.clientY-h.y,p.clientX-h.x));break}},n.canvas.addEventListener("touchstart",n._canvasTouchHandler,{passive:!1}),n.canvas.addEventListener("touchmove",n._canvasTouchHandler,{passive:!1})}function mn(n){document.removeEventListener("keydown",n._keyDownHandler,!0),document.removeEventListener("keyup",n._keyUpHandler,!0),n.el&&n.el.removeEventListener("mousemove",n._mouseMoveHandler),n.canvas&&n.canvas.removeEventListener("mousedown",n._mouseDownHandler),n.canvas&&n._canvasTouchHandler&&(n.canvas.removeEventListener("touchstart",n._canvasTouchHandler),n.canvas.removeEventListener("touchmove",n._canvasTouchHandler)),window.removeEventListener("resize",n._resizeHandler)}function gn(n){const{ctx:e,W:t,H:s}=n;e.clearRect(0,0,t,s),e.strokeStyle="rgba(255, 255, 255, 0.03)",e.lineWidth=1;const r=60;for(let i=0;i<t;i+=r)e.beginPath(),e.moveTo(i,0),e.lineTo(i,s),e.stroke();for(let i=0;i<s;i+=r)e.beginPath(),e.moveTo(0,i),e.lineTo(t,i),e.stroke();e.strokeStyle="rgba(255, 255, 255, 0.4)",e.lineWidth=3,e.lineCap="round";for(const i of n.walls)e.beginPath(),e.moveTo(i.x1,i.y1),e.lineTo(i.x2,i.y2),e.stroke();e.strokeStyle="rgba(255, 255, 255, 0.08)",e.lineWidth=8;for(const i of n.walls)e.beginPath(),e.moveTo(i.x1,i.y1),e.lineTo(i.x2,i.y2),e.stroke();for(const i of n.bullets){const{tailX:o,tailY:a}=cn(i);e.strokeStyle=i.color||"rgba(255, 255, 255, 0.8)",e.lineWidth=2,e.lineCap="round",e.beginPath(),e.moveTo(o,a),e.lineTo(i.x,i.y),e.stroke(),e.strokeStyle=(i.color||"rgba(255,255,255,0.8)").replace(")",",0.3)").replace("rgb","rgba"),e.lineWidth=5,e.beginPath(),e.moveTo(o,a),e.lineTo(i.x,i.y),e.stroke()}bn(n),yn(n),_n(n),vn(n),xn(n),kn(n)}function bn(n){const{ctx:e}=n;for(let t=n._sparks.length-1;t>=0;t--){const s=n._sparks[t];e.fillStyle=`rgba(255, 200, 50, ${s.life/8})`,e.beginPath(),e.arc(s.x,s.y,3*(s.life/8),0,Math.PI*2),e.fill(),s.life--,s.life<=0&&n._sparks.splice(t,1)}for(let t=n._hitFlashes.length-1;t>=0;t--){const s=n._hitFlashes[t];e.fillStyle=`rgba(255, 255, 255, ${s.time/15*.4})`,e.beginPath(),e.arc(s.x,s.y,_*2*(1-s.time/15)+_,0,Math.PI*2),e.fill(),s.time--,s.time<=0&&n._hitFlashes.splice(t,1)}}function yn(n){const{ctx:e}=n,t=n.network.myId;for(const[s,r]of n.players){const i=s===t,o=r.eliminated?.2:1;if(e.save(),e.globalAlpha=o,r.eliminated){e.strokeStyle=r.color,e.lineWidth=2,e.beginPath(),e.arc(r.x,r.y,_,0,Math.PI*2),e.stroke(),e.beginPath(),e.moveTo(r.x-6,r.y-6),e.lineTo(r.x+6,r.y+6),e.moveTo(r.x+6,r.y-6),e.lineTo(r.x-6,r.y+6),e.stroke(),e.restore();continue}e.fillStyle=r.color,e.beginPath(),e.arc(r.x,r.y,_,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(255,255,255,0.4)",e.lineWidth=1.5,e.beginPath(),e.arc(r.x,r.y,_,0,Math.PI*2),e.stroke(),i&&(e.strokeStyle=r.color,e.lineWidth=3,e.lineCap="round",e.beginPath(),e.moveTo(r.x+Math.cos(r.angle)*_,r.y+Math.sin(r.angle)*_),e.lineTo(r.x+Math.cos(r.angle)*(_+Gt),r.y+Math.sin(r.angle)*(_+Gt)),e.stroke()),e.fillStyle="rgba(255,255,255,0.7)",e.font="10px -apple-system, sans-serif",e.textAlign="center",e.fillText(r.username,r.x,r.y+_+14);const a=M((r.hp||0)/F,0,1);if(e.strokeStyle=a>.5?"#66bb6a":a>.25?"#ffa726":"#ef5350",e.lineWidth=3,e.beginPath(),e.arc(r.x,r.y,_+4,-Math.PI/2,-Math.PI/2+Math.PI*2*a),e.stroke(),r.armor>0){const c=M((r.armor||0)/Qt,0,1);e.strokeStyle="rgba(66,165,245,0.9)",e.lineWidth=2,e.beginPath(),e.arc(r.x,r.y,_+8,-Math.PI/2,-Math.PI/2+Math.PI*2*c),e.stroke()}e.restore()}}function _n(n){const{ctx:e}=n;for(const t of n.zombies||[]){e.fillStyle=t.color,e.beginPath(),e.arc(t.x,t.y,t.r,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(0,0,0,0.45)",e.lineWidth=2,e.beginPath(),e.arc(t.x,t.y,t.r,0,Math.PI*2),e.stroke();const s=M(t.hp/t.maxHp,0,1);e.strokeStyle="rgba(255,255,255,0.9)",e.lineWidth=2,e.beginPath(),e.moveTo(t.x-10,t.y-t.r-7),e.lineTo(t.x-10+20*s,t.y-t.r-7),e.stroke()}}function vn(n){const{ctx:e}=n,t=n.players.get(n.network.myId);!t||t.eliminated||(e.strokeStyle="rgba(255,255,255,0.3)",e.lineWidth=1,e.beginPath(),e.arc(n.mouseX,n.mouseY,8,0,Math.PI*2),e.stroke(),e.beginPath(),e.moveTo(n.mouseX-12,n.mouseY),e.lineTo(n.mouseX+12,n.mouseY),e.moveTo(n.mouseX,n.mouseY-12),e.lineTo(n.mouseX,n.mouseY+12),e.stroke())}function xn(n){const{ctx:e}=n;for(const t of n.items){const s=ge[t.type];if(!s)continue;const r=1+Math.sin(Date.now()/120)*.1;e.fillStyle=s.color,e.beginPath(),e.arc(t.x,t.y,me*r,0,Math.PI*2),e.fill(),e.fillStyle="rgba(0,0,0,0.45)",e.beginPath(),e.arc(t.x,t.y,me*.6,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255,255,255,0.9)",e.font="9px -apple-system, sans-serif",e.textAlign="center",e.fillText(s.label[0],t.x,t.y+3)}}function kn(n){if(Date.now()>=n._statusTextUntil||!n._statusText)return;const{ctx:e,W:t}=n;e.fillStyle="rgba(0,0,0,0.45)",e.fillRect(t/2-170,46,340,26),e.fillStyle="rgba(255,255,255,0.95)",e.textAlign="center",e.font="12px -apple-system, sans-serif",e.fillText(n._statusText,t/2,63)}function Sn(n){var i;const e=(i=n.el)==null?void 0:i.querySelector("#rpjs-arena-scoreboard");if(!e)return;const t=n.network.myId;let s='<div style="font-weight:600;margin-bottom:4px;color:rgba(255,255,255,0.9)">Players</div>';const r=Array.from(n.players.entries()).sort((o,a)=>o[1].eliminated&&!a[1].eliminated?1:!o[1].eliminated&&a[1].eliminated?-1:a[1].hp+a[1].armor-(o[1].hp+o[1].armor));for(const[o,a]of r){const c=o===t,l=a.eliminated||a.hp<45?"hit":"alive",p=a.eliminated?"OUT":`HP ${Math.max(0,Math.round(a.hp))}`;s+=`<div class="rpjs-arena-scoreboard-row">
      <span class="rpjs-arena-scoreboard-name">
        <span style="width:6px;height:6px;border-radius:50%;background:${a.color};display:inline-block"></span>
        <span style="${c?"font-weight:600":""}">${a.username}</span>
      </span>
      <span class="rpjs-arena-scoreboard-hp ${l}" title="Armor ${Math.round(a.armor||0)} | Weapon ${a.weapon||"blaster"}">${p}</span>
    </div>`}n.zombieMode&&(s+=`<div class="rpjs-arena-scoreboard-row"><span>Zombies</span><span>${n.zombies.length}</span></div>`,s+=`<div class="rpjs-arena-scoreboard-row"><span>Wave</span><span>${n._zombieWave||1}</span></div>`,s+=`<div class="rpjs-arena-scoreboard-row"><span>Defeated</span><span>${n._zombiesDefeated||0}</span></div>`),e.innerHTML=s}function Cn(n){var c;const e=(c=n.el)==null?void 0:c.querySelector("#rpjs-arena-player-count");if(!e)return;const t=Array.from(n.players.values()).filter(l=>!l.eliminated).length,s=n.players.get(n.network.myId),r=s?Math.round(s.hp||0):0,i=s?Math.round(s.armor||0):0,o=s?(s.weapon||"blaster").toUpperCase():"BLASTER",a=n.zombieMode?` · W${n._zombieWave||1} · ZM ${Math.round(n._zombiesPerMin)}/min`:"";e.textContent=`Alive ${t}/${n.players.size} · HP ${r} · AR ${i} · ${o}${a}`}function ns(n,e,t,s,r,i,o){const a=t-n,c=s-e,l=n-r,p=e-i,d=a*a+c*c,h=2*(l*a+p*c),f=l*l+p*p-o*o;let b=h*h-4*d*f;if(b<0)return!1;b=Math.sqrt(b);const u=(-h-b)/(2*d),y=(-h+b)/(2*d);return u>=0&&u<=1||y>=0&&y<=1||u<0&&y>1}function jn(n,e,t,s,r,i,o,a){const c=(n-t)*(i-a)-(e-s)*(r-o);if(Math.abs(c)<1e-4)return!1;const l=((n-r)*(i-a)-(e-i)*(r-o))/c,p=-((n-t)*(e-i)-(e-s)*(n-r))/c;return l>=0&&l<=1&&p>=0&&p<=1}class He{constructor(e,t,{onStart:s,onStop:r}={}){Fe(this,"_hitFlashes",[]);Fe(this,"_sparks",[]);this.network=e,this.isHub=t,this._onStartCb=s||null,this._onStopCb=r||null,this.el=null,this.canvas=null,this.ctx=null,this.running=!1,this.animFrame=null,this.W=0,this.H=0,this.players=new Map,this.walls=[],this.bullets=[],this.seed=0,this.gameId=null,this.items=[],this._itemSpawnAt=0,this.zombieMode=!1,this.zombies=[],this._zombiesPerMin=10,this._nextZombieSpawnAt=0,this._zombieStartAt=0,this._zombiesDefeated=0,this._zombieWave=1,this._nextWaveAtKills=10,this.keysDown=new Set,this.mouseX=0,this.mouseY=0,this.touchDx=0,this.touchDy=0,this._joystickTouchId=null,this._joystickCenter=null,this._shootTouchInterval=null,this._isTouchDevice=!1,this._stateBroadcastInterval=null,this._inputSendInterval=null,this._onArenaState=null,this._onArenaInput=null,this._onArenaShoot=null,this._onArenaHit=null,this._onArenaEnd=null,this._statusText="",this._statusTextUntil=0,this._keyDownHandler=null,this._keyUpHandler=null,this._mouseMoveHandler=null,this._mouseDownHandler=null,this._resizeHandler=null,this._canvasTouchHandler=null,this._spawnPoints=[]}start(e){this.gameId=e.gameId,this.seed=e.seed,this._render(),this._resize();const t=Math.max(1,this.network.getUserList().length+(this.network.myUser?1:0)),s=ts(this.W,this.H,this.seed,t);this.walls=s.walls,this._spawnPoints=s.spawns;const r=this.network.getUserList(),i=this.network.myUser;i&&!r.find(o=>o.id===i.id)&&(r.push({id:i.id,username:i.username,color:i.color,isHub:i.isHub,number:i.number}),r.sort((o,a)=>o.isHub&&!a.isHub?-1:!o.isHub&&a.isHub?1:(o.number||0)-(a.number||0)));for(let o=0;o<r.length;o++){const a=r[o],c=this._spawnPoints[o%this._spawnPoints.length]||{x:this.W/2,y:this.H/2};this.players.set(a.id,{x:c.x,y:c.y,angle:0,color:a.color,username:a.username,hp:F,armor:0,weapon:"blaster",weaponUntil:0,lastShootTime:0,eliminated:!1})}this.zombieMode=this.isHub&&this.players.size===1,this._zombiesPerMin=10,this._zombieStartAt=Date.now(),this._nextZombieSpawnAt=Date.now()+2500,this._zombiesDefeated=0,this._zombieWave=1,this._nextWaveAtKills=10,this.zombieMode&&this._setStatus("Zombie Mode: survive as long as possible"),this._bindEvents(),this.running=!0,this.isHub?this._stateBroadcastInterval=setInterval(()=>{this._hubBroadcastState()},Js):this._inputSendInterval=setInterval(()=>{this._sendInput()},Ks),this._onArenaState=o=>this._handleStateUpdate(o),this._onArenaInput=o=>this._handleRemoteInput(o),this._onArenaShoot=o=>this._handleRemoteShoot(o),this._onArenaHit=o=>this._handleRemoteHit(o),this._onArenaEnd=o=>this._handleEnd(o),this.network.on("arena-state",this._onArenaState),this.network.on("arena-input",this._onArenaInput),this.network.on("arena-shoot",this._onArenaShoot),this.network.on("arena-hit",this._onArenaHit),this.network.on("arena-end",this._onArenaEnd),this._onStartCb&&this._onStartCb(),this._loop()}static triggerStart(e){const t={gameId:`arena-${Date.now()}`,seed:Math.floor(Math.random()*1e5)};return e.startArena(t),t}_render(){this.el&&this.el.remove(),this.el=document.createElement("div"),this.el.className="rpjs-arena-overlay",this.el.innerHTML=`
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
    `,document.body.appendChild(this.el),this.canvas=this.el.querySelector("#rpjs-arena-canvas"),this.ctx=this.canvas.getContext("2d")}_resize(){if(this.W=window.innerWidth,this.H=window.innerHeight,this.canvas.width=this.W,this.canvas.height=this.H,this.seed){const e=ts(this.W,this.H,this.seed,Math.max(1,this.players.size));this.walls=e.walls}}_bindEvents(){un(this)}_unbindEvents(){mn(this),this._onArenaState&&this.network.off("arena-state",this._onArenaState),this._onArenaInput&&this.network.off("arena-input",this._onArenaInput),this._onArenaShoot&&this.network.off("arena-shoot",this._onArenaShoot),this._onArenaHit&&this.network.off("arena-hit",this._onArenaHit),this._onArenaEnd&&this.network.off("arena-end",this._onArenaEnd)}_sendInput(){const e=this.players.get(this.network.myId);if(!e||e.eliminated)return;let t=0,s=0;if((this.keysDown.has("h")||this.keysDown.has("a"))&&(t-=1),(this.keysDown.has("l")||this.keysDown.has("d"))&&(t+=1),(this.keysDown.has("k")||this.keysDown.has("w"))&&(s-=1),(this.keysDown.has("j")||this.keysDown.has("s"))&&(s+=1),t+=this.touchDx,s+=this.touchDy,t===0&&s===0)return;const r=this._moveSpeedFor(e),i=Math.sqrt(t*t+s*s),o=i>1?i:1;t=t/o*r,s=s/o*r,e.x=M(e.x+t,_,this.W-_),e.y=M(e.y+s,_,this.H-_),this._resolveWalls(e),this.network.sendArenaInput({x:e.x,y:e.y,angle:e.angle})}_shoot(){const e=this.players.get(this.network.myId);if(!e||e.eliminated)return;const t=Date.now(),s=this._weaponConfigFor(e);if(t-e.lastShootTime<s.cooldown)return;e.lastShootTime=t;const r=Q(e.x,e.y,this.mouseX,this.mouseY),i=M((r-Kt)/(Gs-Kt),0,1),o=s.count==null?Math.round(Ae+(qs-Ae)*i):s.count,a=s.spread==null?De+(Ys-De)*i:s.spread,c={x:e.x,y:e.y,angle:e.angle,color:e.color,count:o,spread:a,damage:s.damage,bulletSpeed:s.bulletSpeed,life:s.life,weapon:e.weapon};this._createBullets(this.network.myId,c),this.network.sendArenaShoot(c)}_createBullets(e,t){const s=t.count||Ae,r=t.spread!=null?t.spread:De,i=t.bulletSpeed||Xt,o=t.life||120,a=t.damage||25;for(let c=0;c<s;c++){const l=t.angle+(c-(s-1)/2)*r;this.bullets.push({x:t.x+Math.cos(t.angle)*(_+4),y:t.y+Math.sin(t.angle)*(_+4),vx:Math.cos(l)*i,vy:Math.sin(l)*i,from:e,color:t.color,life:o,speed:i,damage:a,weapon:t.weapon||"blaster"})}}_moveSpeedFor(e){const t=M((e.hp||F)/F,.3,1),s=Vt+(Ws-Vt)*(1-t);return e.weapon==="rapid"?s+.5:s}_weaponConfigFor(e){const t=Date.now();return e.weapon!=="blaster"&&e.weaponUntil&&t>e.weaponUntil&&(e.weapon="blaster",e.weaponUntil=0),Oe[e.weapon]||Oe.blaster}_resolveWalls(e){for(const t of this.walls)if(ns(t.x1,t.y1,t.x2,t.y2,e.x,e.y,_)){const s=t.x2-t.x1,r=t.y2-t.y1,i=s*s+r*r;let o=((e.x-t.x1)*s+(e.y-t.y1)*r)/i;o=M(o,0,1);const a=t.x1+o*s,c=t.y1+o*r,l=e.x-a,p=e.y-c,d=Math.sqrt(l*l+p*p);if(d<_&&d>.01){const h=_-d+1;e.x+=l/d*h,e.y+=p/d*h}}}_handleRemoteInput(e){if(!this.isHub)return;const t=this.players.get(e.from);!t||t.eliminated||(t.x=M(e.x,_,this.W-_),t.y=M(e.y,_,this.H-_),t.angle=e.angle,this._resolveWalls(t))}_handleRemoteShoot(e){this.isHub&&this._createBullets(e.from,e)}_handleRemoteHit(e){const t=this.players.get(e.targetId);t&&(t.hp=e.hp,t.armor=e.armor||0,t.eliminated=e.eliminated),this._hitFlashes.push({x:e.x,y:e.y,time:10,color:e.color||"#fff"})}_hubBroadcastState(){const e={};for(const[s,r]of this.players)e[s]={x:Math.round(r.x*10)/10,y:Math.round(r.y*10)/10,angle:Math.round(r.angle*100)/100,hp:r.hp,armor:r.armor,weapon:r.weapon,weaponUntil:r.weaponUntil||0,eliminated:r.eliminated};const t=this.bullets.map(s=>({x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,vx:Math.round(s.vx*10)/10,vy:Math.round(s.vy*10)/10,from:s.from,color:s.color,life:s.life,damage:s.damage,speed:s.speed,weapon:s.weapon}));this.network.broadcastArenaState({gameId:this.gameId,players:e,bullets:t,items:this.items,zombies:this.zombies,zombieMode:this.zombieMode,zombiesPerMin:this._zombiesPerMin,zombieWave:this._zombieWave,zombiesDefeated:this._zombiesDefeated})}_handleStateUpdate(e){if(!this.isHub){for(const[t,s]of Object.entries(e.players||{})){let r=this.players.get(t);r||(r={x:s.x,y:s.y,angle:s.angle,color:"#4fc3f7",username:"?",hp:F,armor:0,weapon:"blaster",weaponUntil:0,lastShootTime:0,eliminated:!1},this.players.set(t,r)),t!==this.network.myId&&(r.x=s.x,r.y=s.y,r.angle=s.angle),r.hp=s.hp??F,r.armor=s.armor??0,r.weapon=s.weapon||"blaster",r.weaponUntil=s.weaponUntil||0,r.eliminated=s.eliminated}this.bullets=(e.bullets||[]).map(t=>({...t})),this.items=(e.items||[]).map(t=>({...t})),this.zombies=(e.zombies||[]).map(t=>({...t})),this.zombieMode=!!e.zombieMode,this._zombiesPerMin=e.zombiesPerMin||this._zombiesPerMin,this._zombieWave=e.zombieWave||this._zombieWave,this._zombiesDefeated=e.zombiesDefeated||this._zombiesDefeated}}_loop(){this.running&&(this.isHub?this._updateHub():this._updateClient(),this.running&&(this._draw(),this._updateHud(),this._updateScoreboard(),this.animFrame=requestAnimationFrame(()=>this._loop())))}_updateHub(){const e=this.players.get(this.network.myId);if(e&&!e.eliminated){let t=0,s=0;if((this.keysDown.has("h")||this.keysDown.has("a"))&&(t-=1),(this.keysDown.has("l")||this.keysDown.has("d"))&&(t+=1),(this.keysDown.has("k")||this.keysDown.has("w"))&&(s-=1),(this.keysDown.has("j")||this.keysDown.has("s"))&&(s+=1),t+=this.touchDx,s+=this.touchDy,t!==0||s!==0){const r=this._moveSpeedFor(e),i=Math.sqrt(t*t+s*s),o=i>1?i:1;e.x=M(e.x+t/o*r,_,this.W-_),e.y=M(e.y+s/o*r,_,this.H-_),this._resolveWalls(e)}e.angle=Math.atan2(this.mouseY-e.y,this.mouseX-e.x)}this._updateBullets(),this._updateItems(),this._updateZombies(),this._checkBulletCollisions()}_updateClient(){const e=this.players.get(this.network.myId);e&&!e.eliminated&&(e.angle=Math.atan2(this.mouseY-e.y,this.mouseX-e.x)),this._updateBullets()}_updateBullets(){sn({bullets:this.bullets,W:this.W,H:this.H,walls:this.walls,sparks:this._sparks},jn)}_checkBulletCollisions(){this.isHub&&(this.zombieMode&&this._checkZombieBulletCollisions(),nn({bullets:this.bullets,players:this.players,hitFlashes:this._hitFlashes,sparks:this._sparks},e=>{this.network.broadcastArenaHit(e),this._checkGameOver()}))}_checkZombieBulletCollisions(){for(let e=this.bullets.length-1;e>=0;e--){const t=this.bullets[e];for(let s=this.zombies.length-1;s>=0;s--){const r=this.zombies[s];if(!(Q(t.x,t.y,r.x,r.y)>r.r+3)){r.hp-=t.damage||25,this._sparks.push({x:t.x,y:t.y,life:7,color:r.color}),this.bullets.splice(e,1),r.hp<=0&&(this._zombiesDefeated++,this._setStatus(`Zombie down! (${this._zombiesDefeated})`),this.zombies.splice(s,1),this._checkWaveMilestone());break}}}}_updateItems(){if(!this.isHub)return;const e={items:this.items,players:this.players,walls:this.walls,W:this.W,H:this.H,itemSpawnAt:this._itemSpawnAt};an(e,ns,t=>this._setStatus(t)),this._itemSpawnAt=e.itemSpawnAt}_updateZombies(){if(!this.zombieMode||!this.isHub)return;const e=Date.now(),t=(e-this._zombieStartAt)/6e4;this._zombiesPerMin=10+t*8;const s=Math.max(240,6e4/this._zombiesPerMin);e>=this._nextZombieSpawnAt&&(this._spawnZombie(),this._nextZombieSpawnAt=e+s);const r=this.players.get(this.network.myId);if(!(!r||r.eliminated))for(let i=this.zombies.length-1;i>=0;i--){const o=this.zombies[i],a=r.x-o.x,c=r.y-o.y,l=Math.max(.001,Math.sqrt(a*a+c*c)),p=o.speed*(1+t*.2);o.x+=a/l*p,o.y+=c/l*p,l<o.r+_+2&&e-(o.lastBiteAt||0)>500&&(o.lastBiteAt=e,r.hp-=8,r.hp<=0&&(r.hp=0,r.eliminated=!0,this._checkGameOver())),o.hp<=0&&this.zombies.splice(i,1)}}_spawnZombie(){const e=Math.floor(Math.random()*4);let t=0,s=0;e===0&&(t=Math.random()*this.W,s=-30),e===1&&(t=this.W+30,s=Math.random()*this.H),e===2&&(t=Math.random()*this.W,s=this.H+30),e===3&&(t=-30,s=Math.random()*this.H);const r=Math.min(.75,.55+this._zombieWave*.03),i=Math.random()<r,o=i?"runner":"tank",a=i?{r:10+Math.random()*2,hp:28+this._zombieWave*2,speed:1.1+Math.random()*.45,color:"#4dd0e1"}:{r:16+Math.random()*3,hp:95+this._zombieWave*7,speed:.42+Math.random()*.2,color:"#ff8a65"};this.zombies.push({id:`z-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,x:t,y:s,r:a.r,hp:a.hp,maxHp:a.hp,speed:a.speed,color:a.color,archetype:o,lastBiteAt:0})}_checkWaveMilestone(){!this.zombieMode||!this.isHub||this._zombiesDefeated<this._nextWaveAtKills||(this._zombieWave++,this._nextWaveAtKills+=8+this._zombieWave*2,this._zombiesPerMin+=2.5,this._setStatus(`Wave ${this._zombieWave}! Reward drop incoming`),this._dropWaveRewards())}_dropWaveRewards(){const e=["heal","armor","rapid","spread","sniper"],t=Math.min(5,2+Math.floor(this._zombieWave/2)),s=this.players.get(this.network.myId),r=s?s.x:this.W/2,i=s?s.y:this.H/2;for(let o=0;o<t;o++){const a=e[Math.floor(Math.random()*e.length)];if(!ge[a])continue;const c=Math.PI*2*o/t,l=56+Math.random()*36;this.items.push({id:`it-wave-${Date.now()}-${o}-${Math.random().toString(36).slice(2,6)}`,type:a,x:M(r+Math.cos(c)*l,30,this.W-30),y:M(i+Math.sin(c)*l,30,this.H-30),ttl:900})}}_setStatus(e){this._statusText=e,this._statusTextUntil=Date.now()+1800}_checkGameOver(){if(this.zombieMode){const t=this.players.get(this.network.myId);if(t&&!t.eliminated)return;this.network.broadcastArenaEnd({gameId:this.gameId,winner:null,zombieMode:!0,durationMs:Date.now()-this._zombieStartAt,zombiesDefeated:this._zombiesDefeated||0,zombieWave:this._zombieWave});return}const e=[];for(const[t,s]of this.players)s.eliminated||e.push({id:t,username:s.username,color:s.color});e.length<=1&&this.network.broadcastArenaEnd({gameId:this.gameId,winner:e[0]||null,standings:Array.from(this.players.entries()).map(([t,s])=>({id:t,username:s.username,color:s.color,hp:s.hp,armor:s.armor,weapon:s.weapon,eliminated:s.eliminated}))})}_handleEnd(e){this.running=!1,this._draw();const t=this.ctx;if(t.fillStyle="rgba(0, 0, 0, 0.6)",t.fillRect(0,0,this.W,this.H),t.textAlign="center",t.fillStyle="#fff",t.font="bold 36px -apple-system, sans-serif",e.zombieMode){const r=Math.round((e.durationMs||0)/1e3);t.fillText(`Survived ${r}s`,this.W/2,this.H/2-20),t.font="18px -apple-system, sans-serif",t.fillStyle="rgba(255,255,255,0.8)",t.fillText(`Wave ${e.zombieWave||this._zombieWave} · ${e.zombiesDefeated||0} zombies defeated`,this.W/2,this.H/2+8)}else e.winner?t.fillText(`${e.winner.username} Wins!`,this.W/2,this.H/2-20):t.fillText("Draw!",this.W/2,this.H/2-20);t.font="16px -apple-system, sans-serif",t.fillStyle="rgba(255,255,255,0.5)",t.fillText("Click or press any key to close",this.W/2,this.H/2+20);const s=()=>this.stop();this.el.addEventListener("click",s,{once:!0}),document.addEventListener("keydown",s,{once:!0})}_draw(){gn(this)}_updateScoreboard(){Sn(this)}_updateHud(){Cn(this)}stop(){this.running=!1,this.animFrame&&(cancelAnimationFrame(this.animFrame),this.animFrame=null),this._stateBroadcastInterval&&(clearInterval(this._stateBroadcastInterval),this._stateBroadcastInterval=null),this._inputSendInterval&&(clearInterval(this._inputSendInterval),this._inputSendInterval=null),this._shootTouchInterval&&(clearInterval(this._shootTouchInterval),this._shootTouchInterval=null),this._unbindEvents(),this.el&&(this.el.remove(),this.el=null),this.players.clear(),this.bullets=[],this.items=[],this.zombies=[],this._hitFlashes=[],this._sparks=[],this._onStopCb&&this._onStopCb()}}return()=>({id:"peerjs",init(n){console.log("[RevealPeerJS] Plugin initializing..."),Ms();const e=Rs(),t=new Es;let s=null,r=null,i=null,o=null,a=null;const c={onStart:()=>n.configure({keyboard:!1}),onStop:()=>n.configure({keyboard:!0})};function l(){a&&(a.stop(),a=null);const u=He.triggerStart(t);a=new He(t,!0,c),a.start(u)}const p=document.createElement("div");p.className="rpjs-toolbar",p.innerHTML=`
      <button id="rpjs-btn-lobby" type="button" title="Lobby & Chat" aria-label="Lobby & Chat">${Wt}</button>
      <button id="rpjs-btn-settings" type="button" title="Settings" aria-label="Settings">${Is}</button>
    `,console.log("[RevealPeerJS] Creating toolbar and appending to body..."),document.body.appendChild(p),console.log("[RevealPeerJS] Toolbar appended. Visible:",p.offsetParent!==null),document.getElementById("rpjs-btn-lobby").addEventListener("click",()=>{s||(s=new Ns(t,e)),s.toggle(),document.getElementById("rpjs-btn-lobby").classList.toggle("rpjs-active",s.isVisible())}),document.getElementById("rpjs-btn-settings").addEventListener("click",()=>{r||(r=new Bs(t,e,u=>{Object.assign(e,u)})),r.show()}),t.on("connected",({isHub:u,user:y})=>{console.log(`[RevealPeerJS] Connected as ${u?"HUB":"VISITOR"} (${y.username})`);const S=document.getElementById("rpjs-status-dot");if(S&&S.classList.remove("rpjs-connecting","rpjs-offline"),u&&!document.getElementById("rpjs-btn-hub")){const C=document.createElement("button");C.id="rpjs-btn-hub",C.className="rpjs-hub-btn",C.title="Hub Controls",C.innerHTML=Ls,C.addEventListener("click",()=>{i||(i=new Fs(t,n,l)),i.toggle()}),p.appendChild(C)}}),t.on("error",u=>{console.error("[RevealPeerJS] Error:",u);const y=document.getElementById("rpjs-status-dot");y&&y.classList.add("rpjs-offline")}),t.on("user-list",()=>{s&&s.updateUsers()}),t.on("chat",u=>{s&&s.isVisible()&&s.addChatMessage(u)}),t.on("chat-history",()=>{s&&s.updateChat()}),t.on("assigned-name",u=>{e.username=u,Ft(e)}),t.on("jump-slide",u=>{n.slide(u.indexh,u.indexv)}),t.on("follow-mode",({active:u})=>{u&&console.log("[RevealPeerJS] Follow mode enabled")}),t.on("poll-start",u=>{d(u)}),t.on("poll-results",u=>{h(u)}),t.on("pong-invite",u=>{f(u)}),t.on("pong-accept",u=>{u.to===t.myId&&(o=new Yt(t,!0,u.from,c),o.start())}),t.on("arena-start",u=>{t.isHub||(a&&(a.stop(),a=null),a=new He(t,!1,c),a.start(u))}),n.on("slidechanged",()=>{if(!t.isHub){const u=n.getIndices();t.reportSlideChange(u.h,u.v)}});function d(u){const y=document.createElement("div");y.className="rpjs-poll-vote-overlay";const S=u.mode||"single",C=new Set,q=u.timeout||10,A=Date.now(),D=q*1e3;y.innerHTML=`
        <div class="rpjs-poll-vote-card" role="dialog" aria-label="Poll vote">
          <div class="rpjs-poll-vote-meta">${b(u.fromUsername||"Hub")} asks · ${S==="multiple"?"multiple choice":"single choice"}</div>
          <div class="rpjs-poll-vote-question">${b(u.question)}</div>
          ${S==="multiple"?'<div class="rpjs-poll-vote-hint">Select every answer that applies, then submit.</div>':""}
          <div class="rpjs-poll-vote-options" id="rpjs-vote-options">
            ${u.answers.map((v,se)=>`
              <button class="rpjs-poll-vote-option" type="button" data-index="${se}" aria-pressed="false">
                <span class="rpjs-poll-vote-option-marker">${S==="multiple"?"□":"•"}</span>
                <span>${b(v)}</span>
              </button>
            `).join("")}
          </div>
          ${S==="multiple"?'<button class="rpjs-poll-submit-vote" id="rpjs-poll-submit-vote" type="button" disabled>Submit Vote</button>':""}
          <div class="rpjs-poll-timer-bar" aria-hidden="true">
            <div class="rpjs-poll-timer-fill" id="rpjs-timer-fill" style="width:100%"></div>
          </div>
        </div>
      `,document.body.appendChild(y);const j=()=>{clearInterval(I),y.parentNode&&y.remove()},X=()=>{C.size!==0&&(t.answerPoll(u.pollId,[...C]),j())},$=()=>{const v=y.querySelector("#rpjs-poll-submit-vote");v&&(v.disabled=C.size===0)},I=setInterval(()=>{const v=Date.now()-A,se=Math.max(0,1-v/D),G=y.querySelector("#rpjs-timer-fill");G&&(G.style.width=`${se*100}%`),v>=D&&j()},50);y.querySelectorAll(".rpjs-poll-vote-option").forEach(v=>{v.addEventListener("click",()=>{const se=parseInt(v.getAttribute("data-index")),G=u.answers[se];if(S!=="multiple"){t.answerPoll(u.pollId,G),j();return}if(C.has(G)){C.delete(G),v.classList.remove("rpjs-selected"),v.setAttribute("aria-pressed","false");const ne=v.querySelector(".rpjs-poll-vote-option-marker");ne&&(ne.textContent="□")}else{C.add(G),v.classList.add("rpjs-selected"),v.setAttribute("aria-pressed","true");const ne=v.querySelector(".rpjs-poll-vote-option-marker");ne&&(ne.textContent="☑")}$()})});const Y=y.querySelector("#rpjs-poll-submit-vote");Y&&Y.addEventListener("click",X),setTimeout(j,(q+1)*1e3)}function h(u){const y=document.createElement("div");y.className="rpjs-modal-overlay";const S=u.totalResponses||0,C=u.totalSelections??u.answers.reduce((j,X)=>j+(X.count||0),0),q=u.mode||"single",A=[`${S} voter${S===1?"":"s"}`,`${C} selection${C===1?"":"s"}`];q==="multiple"&&A.push("multiple choice");const D=(j,X)=>{const $=j.count||0,I=Math.max(0,Math.min(100,j.percentage||0)),Y=j.rank||X+1,v=!!j.isWinner;return`
          <div class="rpjs-poll-result-row" data-leading="${v?"true":"false"}">
            <div class="rpjs-poll-result-heading">
              <span class="rpjs-poll-result-rank">#${Y}</span>
              <span class="rpjs-poll-result-text">${b(j.text)}</span>
              ${v?'<span class="rpjs-poll-result-winner">Top choice</span>':""}
            </div>
            <div class="rpjs-poll-result-meta">${$} vote${$===1?"":"s"} · ${I}%</div>
            <div class="rpjs-poll-result-bar-bg" role="presentation">
              <div class="rpjs-poll-result-bar-fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${I}" style="width:${I}%"></div>
            </div>
          </div>
        `};y.innerHTML=`
        <div class="rpjs-modal rpjs-poll-results-card" role="dialog" aria-label="Poll results">
          <div class="rpjs-modal-title">
            <span>Poll Results</span>
            <button class="rpjs-modal-close" id="rpjs-vresults-close" type="button" aria-label="Close poll results">&times;</button>
          </div>
          <div class="rpjs-poll-results-question">${b(u.question)}</div>
          <div class="rpjs-poll-results-summary">${A.join(" · ")}</div>
          <div class="rpjs-poll-results-list">
            ${u.answers.map(D).join("")}
          </div>
        </div>
      `,document.body.appendChild(y),y.querySelector("#rpjs-vresults-close").addEventListener("click",()=>y.remove()),y.addEventListener("click",j=>{j.target===y&&y.remove()}),setTimeout(()=>{y.parentNode&&y.remove()},15e3)}function f(u){const y=document.createElement("div");y.className="rpjs-modal-overlay",y.innerHTML=`
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
      `,document.body.appendChild(y),y.querySelector("#rpjs-pong-accept").addEventListener("click",()=>{y.remove();const S={type:m.PONG_ACCEPT,payload:{from:t.myId,to:u.from,fromUsername:t.myUser.username},timestamp:Date.now()};t.isHub?t._sendToPeer(u.from,S):t._sendToPeer(t.lobbyId,S),o=new Yt(t,!1,u.from,c),o.start()}),y.querySelector("#rpjs-pong-decline").addEventListener("click",()=>{y.remove();const S={type:m.PONG_DECLINE,payload:{from:t.myId,to:u.from},timestamp:Date.now()};t.isHub?t._sendToPeer(u.from,S):t._sendToPeer(t.lobbyId,S)})}function b(u){const y=document.createElement("div");return y.textContent=u,y.innerHTML}e.darkMode&&document.body.classList.add("rpjs-dark-mode"),e.highContrast&&document.body.classList.add("rpjs-high-contrast"),t.connect(e).catch(u=>{console.error("[RevealPeerJS] Failed to connect:",u)});const v=()=>{t.destroy()},z=()=>{document.visibilityState==="hidden"&&v()};window.addEventListener("beforeunload",v),window.addEventListener("pagehide",v),document.addEventListener("visibilitychange",z),this.destroy=()=>{window.removeEventListener("beforeunload",v),window.removeEventListener("pagehide",v),document.removeEventListener("visibilitychange",z),t.destroy(),s&&s.destroy(),r&&r.destroy(),i&&i.destroy(),o&&o.stop(),a&&a.stop(),p.remove(),ws()}}})});
//# sourceMappingURL=reveal-peerjs.js.map
