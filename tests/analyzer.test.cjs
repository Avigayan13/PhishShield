const {test} = require('node:test');
const assert = require('node:assert/strict');
const {analyze} = require('../dist/analyzer.js');
test('empty input never produces a score',() => {
  for (const mode of ['url','email']) {
    const out = analyze('  ',mode);
    assert.equal(out.ok,false);
    assert.equal(out.points,undefined);
  }
});
test('rejects random text, malformed links and unsupported schemes',() => {
  for (const text of ['hello','javascript:alert(1)','ftp://example.com','https://','https://exa mple.com','https://-invalid.com','https://localhost']) assert.equal(analyze(text).ok,false,text);
});
test('plain HTTPS example stays explicitly unverified',() => {
  const out = analyze('https://example.com');
  assert.equal(out.points,0);
  assert.match(out.notes[0],/not been verified/);
});
test('IP sample scores 52 with three explanations',() => {
  const out = analyze('http://192.168.10.24/account/verify?user=bank&urgent=true');
  assert.equal(out.points,52);
  assert.equal(out.notes.length,3);
  assert.equal(out.level,'caution');
});
test('IPv6 produces an IP warning',() => {
  assert.equal(analyze('https://[2001:db8::1]/').points,30);
});
test('userinfo deception identifies the actual host',() => {
  const out = analyze('https://trusted.example@attacker.example/');
  assert.equal(out.points,25);
  assert.match(out.notes[0],/attacker.example/);
});
test('path dots are not counted as hostname labels',() => {
  assert.equal(analyze('https://example.com/a.b.c.d.e').points,0);
});
test('internationalized hostname produces a warning',() => {
  assert.equal(analyze('https://xn--bcher-kva.example/').points,18);
});
test('HTTP parsing is case insensitive',() => {
  assert.equal(analyze('HTTP://EXAMPLE.COM/').points,10);
});
test('email sample identifies four distinct signals',() => {
  const out = analyze('URGENT: Your account will be blocked today. Verify your password and OTP now.','email');
  assert.equal(out.points,77);
  assert.equal(out.notes.length,4);
  assert.equal(out.level,'high');
});
test('word boundaries avoid gift matching gifted',() => {
  assert.equal(analyze('A gifted artist shared a sketch.','email').points,0);
});
test('combined warning scores are capped at 100',() => {
  const out = analyze('http://user@a.b.c.d.xn--bcher-kva.example/account/verify/' + 'a'.repeat(100) + '%2f');
  assert.equal(out.ok,true);
  assert.equal(out.points,100);
});
test('oversized input and unsupported modes are rejected',() => {
  assert.equal(analyze('x'.repeat(20001),'email').ok,false);
  assert.equal(analyze('https://example.com','other').ok,false);
});
