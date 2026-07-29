import{readFile}from'node:fs/promises';
import{resolve}from'node:path';

const read=path=>readFile(resolve(path),'utf8');
const checks=[];
const check=(label,pass)=>{checks.push({label,pass:Boolean(pass)});if(!pass)console.error(`FAIL: ${label}`)};

const[team,auth,access,invite,firebase,rules,template,css,generator]=await Promise.all([
  read('src/team-v20.tsx'),read('src/auth.tsx'),read('src/admin-access.ts'),read('src/admin-invite.tsx'),read('src/firebase.ts'),read('firebase.rules.json'),read('firebase.rules.template.json'),read('src/v4917-team.css'),read('scripts/generate-firebase-rules.mjs'),
]);
check('Invite form has owner-controlled Google checkbox',team.includes('Cho phép đăng nhập bằng Google')&&team.includes('setAllowGoogleSignIn'));
check('Active member Google permission can be toggled',team.includes('changeGoogleAccess')&&team.includes('Google bật')&&team.includes('Google tắt'));
check('Invitation and member records store allowGoogleSignIn',access.match(/allowGoogleSignIn:boolean/g)?.length===2&&invite.includes('allowGoogleSignIn:record.allowGoogleSignIn===true'));
check('Google login enforces member flag',auth.includes("provider==='google.com'&&record.allowGoogleSignIn!==true")&&auth.includes('googleDeniedMessage'));
check('Approved pending invite can activate through Google',auth.includes('activateGoogleInvitation')&&auth.includes("item.allowGoogleSignIn===true"));
check('Firebase client supports email-scoped query',firebase.includes('queryByChild')&&firebase.includes('orderByChild(child)')&&firebase.includes('equalTo(equalValue)'));
check('Rules allow only exact authenticated email query',rules.includes("query.orderByChild == 'email'")&&rules.includes('query.equalTo == auth.token.email'));
check('Rules require Google permission boolean',rules.includes("newData.child('allowGoogleSignIn').isBoolean()")&&rules.includes("'allowGoogleSignIn'"));
check('Rules enforce provider gate for dynamic members',rules.includes("auth.token.firebase.sign_in_provider != 'google.com' || root.child('timeforge/adminMembers').child(auth.uid).child('allowGoogleSignIn').val() == true"));
check('Rules prevent Google from accepting an unapproved invite',rules.includes("auth.token.firebase.sign_in_provider != 'google.com' || data.child('allowGoogleSignIn').val() == true"));
check('Only primary owner bypasses the Google member flag',generator.includes('email===ownerEmail?emailRule')&&generator.includes('googleMemberGate'));
check('Template preserves Google access controls',template.includes("query.orderByChild == 'email'")&&template.includes("newData.child('allowGoogleSignIn').isBoolean()"));
check('Google access control CSS exists',css.includes('.tf527-google-permission')&&css.includes('.tf527-member-google'));
JSON.parse(rules);JSON.parse(template);
const failed=checks.filter(item=>!item.pass);
console.log(`V0.52.7 Google access checks: ${checks.length-failed.length}/${checks.length} passed.`);
if(failed.length)process.exit(1);
