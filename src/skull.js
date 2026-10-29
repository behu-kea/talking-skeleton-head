const upperTeeth = Array.from({ length: 10 }, (_, i) => {
  const x = 171 + i * 15.7; const y = 356 + Math.sin(i / 9 * Math.PI) * 10;
  return `<path d="M${x},${y} q7,-4 14,0 l-1,25 q-6,5 -12,0 Z" fill="url(#tooth)" stroke="#6e6856" stroke-width="1.3"/>`;
}).join('');
const lowerTeeth = Array.from({ length: 10 }, (_, i) => {
  const x = 173 + i * 15.3; const y = 394 + Math.sin(i / 9 * Math.PI) * 5;
  return `<path d="M${x},${y} l1,-15 q6,-4 12,0 l1,15" fill="url(#tooth)" stroke="#77705a" stroke-width="1.3"/>`;
}).join('');
export const skull = `<svg id="skull" viewBox="0 0 500 520" role="img" aria-label="Le crâne de Kaptajn Knogle, avec des yeux orange lumineux" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="bone" cx="40%" cy="28%" r="75%"><stop stop-color="#f0ead2"/><stop offset=".38" stop-color="#d5cfb7"/><stop offset=".68" stop-color="#9c9984"/><stop offset=".88" stop-color="#5a6053"/><stop offset="1" stop-color="#292e29"/></radialGradient>
<linearGradient id="jawbone" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#b9b69e"/><stop offset=".6" stop-color="#ded6b9"/><stop offset="1" stop-color="#737763"/></linearGradient>
<linearGradient id="tooth" x2=".2" y2="1"><stop stop-color="#9b9478"/><stop offset=".35" stop-color="#e4d9ba"/><stop offset="1" stop-color="#bdb396"/></linearGradient>
<radialGradient id="socket"><stop stop-color="#000"/><stop offset=".7" stop-color="#080a08"/><stop offset="1" stop-color="#353c31"/></radialGradient>
<radialGradient id="eye"><stop stop-color="#fff4bd"/><stop offset=".15" stop-color="#ffbb55"/><stop offset=".4" stop-color="#f46b27"/><stop offset="1" stop-color="#e34912" stop-opacity="0"/></radialGradient>
<filter id="glow"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="texture"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="3" seed="8" result="noise"/><feComposite in="noise" in2="SourceGraphic" operator="in" result="cut"/><feBlend in="SourceGraphic" in2="cut" mode="soft-light"/></filter>
</defs>
<g id="skull-motion">
<g id="mandible">
<path d="M119 323 Q113 337 122 371 L150 423 Q161 451 203 460 Q250 478 298 458 Q339 448 352 421 L379 360 Q386 338 375 321 L358 337 L337 395 Q324 416 306 416 L196 416 Q174 413 162 389 L140 337 Z" fill="url(#jawbone)" stroke="#555b4b" stroke-width="2"/>
<path d="M151 374 L174 405 Q250 440 327 402 L348 370 L337 416 Q250 459 166 417Z" fill="#21251e"/>
<path d="M168 393 Q250 414 332 391 L323 423 Q250 451 178 423Z" fill="url(#jawbone)"/>
${lowerTeeth}
<path d="M205 444 Q252 454 293 441 M177 424 L184 434 M316 421 L308 435" fill="none" stroke="#767a63" stroke-width="2"/>
</g>
<path d="M145 272 Q106 283 112 317 L133 345 L163 337 L176 368 Q250 395 324 368 L337 338 L366 345 L389 316 Q392 287 356 272 L368 221 Q384 144 342 94 Q311 54 251 52 Q186 50 149 91 Q109 135 128 219 Z" fill="url(#bone)" stroke="#777e6c" stroke-width="2"/>
<path d="M145 220 Q116 173 147 112 Q177 61 244 60" fill="none" stroke="#f4edd5" opacity=".32" stroke-width="5"/>
<path d="M153 206 Q188 191 226 222 L220 242 Q187 216 151 236 L140 258Z" fill="#e3dcc1"/>
<path d="M274 220 Q319 191 350 211 L360 250 L346 240 Q303 218 281 242Z" fill="#c3bfa5"/>
<path d="M145 244 Q163 225 191 232 Q215 238 227 255 Q232 278 212 300 Q179 314 152 297 Q132 277 145 244Z" fill="url(#socket)" stroke="#777e69" stroke-width="5"/>
<path d="M275 254 Q298 230 326 233 Q349 235 357 251 Q370 285 345 300 Q321 316 291 299 Q270 285 275 254Z" fill="url(#socket)" stroke="#707761" stroke-width="5"/>
<g class="eyes"><ellipse cx="184" cy="270" rx="24" ry="21" fill="#ed5a15" opacity=".55" filter="url(#glow)"/><ellipse cx="318" cy="270" rx="24" ry="21" fill="#ed5a15" opacity=".55" filter="url(#glow)"/><ellipse cx="184" cy="270" rx="17" ry="20" fill="url(#eye)"/><ellipse cx="318" cy="270" rx="17" ry="20" fill="url(#eye)"/><ellipse cx="184" cy="270" rx="3" ry="7" fill="#ffe9b0"/><ellipse cx="318" cy="270" rx="3" ry="7" fill="#ffe9b0"/></g>
<path d="M247 273 Q238 288 230 317 Q231 328 244 322 L251 314 L259 324 Q273 329 270 315 L258 278Z" fill="#111710" stroke="#8d9179" stroke-width="3"/>
<path d="M126 307 L152 315 L169 304 L162 328 L143 337Z M373 308 L349 315 L332 304 L340 329 L358 337Z" fill="#434d3d"/>
<path d="M178 335 Q199 321 223 332 M277 331 Q307 321 327 335" fill="none" stroke="#ede4c9" opacity=".35" stroke-width="4"/>
<path d="M170 356 Q250 373 331 355 L329 380 Q248 399 169 380Z" fill="#171b14"/>
${upperTeeth}
<g fill="none" stroke="#5b6353" stroke-linecap="round"><path d="M258 55 L247 88 L261 108 L244 136 L252 156 L237 175" stroke-width="2.2"/><path d="M248 89 L224 95 L217 113 M260 108 L278 110 L287 127 M244 136 L221 143" stroke-width="1.3"/><path d="M151 167 L167 179 L160 190 M349 181 L337 193 L343 204 M135 305 L144 309 M361 300 L355 310 M212 336 L206 346 M289 336 L294 347" stroke-width="1.6"/></g>
<g fill="#535d4b" opacity=".25"><ellipse cx="186" cy="170" rx="3" ry="5"/><ellipse cx="302" cy="153" rx="4" ry="2"/><ellipse cx="218" cy="201" rx="2" ry="3"/><ellipse cx="288" cy="191" rx="2" ry="2"/><ellipse cx="177" cy="139" rx="2" ry="2"/></g>
</g></svg>`;
