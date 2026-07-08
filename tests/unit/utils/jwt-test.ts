import { module, test } from 'qunit';
import { decodeJwtPayload } from 'winds-mobi-client-web/utils/jwt';

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(payload: object): string {
  return `header.${base64Url(JSON.stringify(payload))}.signature`;
}

module('Unit | Utility | jwt', function () {
  test('it decodes the payload claims of a well-formed token', function (assert) {
    const token = makeToken({ username: 'michal', exp: 1_774_341_507 });

    assert.deepEqual(decodeJwtPayload(token), {
      username: 'michal',
      exp: 1_774_341_507,
    });
  });

  test('it decodes base64url payloads', function (assert) {
    // `~~~` encodes to `fn5+` in plain base64, so the segment exercises the
    // base64url character mapping (and the unpadded length).
    const token = makeToken({ username: '~~~', exp: 1 });
    const segment = token.split('.')[1] ?? '';

    assert.true(
      segment.includes('-') || segment.includes('_'),
      'the payload segment contains base64url-specific characters'
    );
    assert.deepEqual(decodeJwtPayload(token), { username: '~~~', exp: 1 });
  });

  test('it returns null when the token has no payload segment', function (assert) {
    assert.strictEqual(decodeJwtPayload('not-a-jwt'), null);
    assert.strictEqual(decodeJwtPayload(''), null);
    assert.strictEqual(decodeJwtPayload('header.'), null);
  });

  test('it returns null when the payload is not valid base64', function (assert) {
    assert.strictEqual(decodeJwtPayload('header.!!!.signature'), null);
  });

  test('it returns null when the payload is not JSON', function (assert) {
    assert.strictEqual(
      decodeJwtPayload(`header.${base64Url('not json')}.signature`),
      null
    );
  });
});
