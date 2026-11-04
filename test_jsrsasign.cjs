const jsrsasign = require('jsrsasign');

const header = { alg: 'HS256', typ: 'JWT' };
const payload = { sub: 'test' };
const secret = 'my-secret';

const hsToken = jsrsasign.KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), { utf8: secret });
console.log('HS256 Token:', hsToken);

const rsaKeypair = jsrsasign.KEYUTIL.generateKeypair('RSA', 2048);
const prvKeyPEM = jsrsasign.KEYUTIL.getPEM(rsaKeypair.prvKeyObj, 'PKCS8PRV');
const pubKeyPEM = jsrsasign.KEYUTIL.getPEM(rsaKeypair.pubKeyObj);

console.log('Testing RS256 with jsrsasign');
try {
  const rsToken = jsrsasign.KJUR.jws.JWS.sign('RS256', JSON.stringify({alg: 'RS256', typ: 'JWT'}), JSON.stringify(payload), prvKeyPEM);
  console.log('RS256 Token signed successfully');
  const valid = jsrsasign.KJUR.jws.JWS.verify(rsToken, pubKeyPEM, ['RS256']);
  console.log('RS256 verified:', valid);
} catch (e) {
  console.error('RS256 failed:', e);
}

const ecKeypair = jsrsasign.KEYUTIL.generateKeypair('EC', 'secp256r1');
const ecPrvKeyPEM = jsrsasign.KEYUTIL.getPEM(ecKeypair.prvKeyObj, 'PKCS8PRV');
const ecPubKeyPEM = jsrsasign.KEYUTIL.getPEM(ecKeypair.pubKeyObj);

console.log('Testing ES256 with jsrsasign');
try {
  const esToken = jsrsasign.KJUR.jws.JWS.sign('ES256', JSON.stringify({alg: 'ES256', typ: 'JWT'}), JSON.stringify(payload), ecPrvKeyPEM);
  console.log('ES256 Token signed successfully');
  const valid = jsrsasign.KJUR.jws.JWS.verify(esToken, ecPubKeyPEM, ['ES256']);
  console.log('ES256 verified:', valid);
} catch (e) {
  console.error('ES256 failed:', e);
}
