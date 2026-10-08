import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkTargetUrl } from '../src/url-guard.js';

for (const host of [
  'localhost.',
  'LOCALHOST',
  'app.localhost.',
  'metadata',
  'metadata.google.internal.',
  'service.local.',
  'intranet',
  '127.1',
  '2130706433',
  '0x7f000001',
  '0177.0.0.1',
  '0.0.0.0',
  '10.255.255.255',
  '169.254.169.254',
  '172.16.0.1',
  '172.31.255.255',
  '192.168.1.1',
  '100.64.0.0',
  '100.100.100.200',
  '100.127.255.255',
  '198.18.0.0',
  '198.19.255.255',
  '192.0.0.1',
  '192.0.2.1',
  '192.88.99.1',
  '198.51.100.1',
  '203.0.113.1',
  '224.0.0.1',
  '255.255.255.255',
  '[::1]',
  '[::ffff:127.0.0.1]',
  '[0:0:0:0:0:ffff:a00:1]',
  '[64:ff9b::a00:1]',
  '[64:ff9b:1::a00:1]',
  '[fc00::1]',
  '[fe80::1]',
  '[fec0::1]',
  '[ff02::1]',
  '[2001::1]',
  '[2002:a00:1::1]',
  '[2001:db8::1]',
  '[3fff::1]',
]) {
  test(`내부·특수 목적 대상을 거부한다: ${host}`, () => {
    assert.equal(checkTargetUrl(`http://${host}/`), 'Target host is not allowed.');
  });
}

for (const host of [
  'example.com',
  'example.com.',
  'local.example.com',
  '8.8.8.8',
  '[2606:4700:4700::1111]',
  '[2001:4860:4860::8888]',
  '100.63.255.255',
  '100.128.0.0',
  '172.15.255.255',
  '172.32.0.0',
  '198.17.255.255',
  '198.20.0.0',
]) {
  test(`공개 대상과 차단 대역 경계를 허용한다: ${host}`, () => {
    assert.equal(checkTargetUrl(`https://${host}/path?next=http://localhost`), null);
  });
}

test('잘못된 URL과 HTTP 이외 프로토콜을 거부한다.', () => {
  assert.equal(checkTargetUrl('not a url'), 'Invalid URL.');
  for (const url of ['file:///etc/passwd', 'ftp://example.com/', 'data:text/plain,test']) {
    assert.equal(checkTargetUrl(url), 'Only http(s) URLs are allowed.');
  }
});
