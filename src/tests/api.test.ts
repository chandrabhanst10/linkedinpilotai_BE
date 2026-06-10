import assert from 'assert';
import jwt from 'jsonwebtoken';
import './mockMongoose.js';
import { db, resetDb } from './mockMongoose.js';
import { register, login, verifyEmail, getOAuthUrls, googleLogin, linkedinLogin } from '../modules/auth/index.js';
import { connectAccount } from '../modules/accounts/index.js';
import { createPost, getPosts } from '../modules/posts/controller.js';
import { publishToLinkedIn } from '../services/playwrightService.js';
import { createMockReq, createMockRes, asHandlerReq, asHandlerRes, testNext } from './types.js';

async function runTests(): Promise<void> {
  console.log('🚀 Starting LinkPilot AI Integration Test Suite...');
  
  try {
    // -------------------------------------------------------------
    // Test 1: User Registration
    // -------------------------------------------------------------
    console.log('\n--- Test 1: User Registration ---');
    resetDb();
    
    const regReq = createMockReq({
      body: {
        name: 'Jane Doe',
        email: 'jane@linkpilot.ai',
        password: 'securePassword123'
      }
    });
    const regRes = createMockRes();
    
    await register(asHandlerReq(regReq), asHandlerRes(regRes), testNext);
    
    assert.strictEqual(regRes.statusCode, 201);
    assert.strictEqual(regRes.jsonData.success, true);
    assert.strictEqual(regRes.jsonData.isVerified, false);
    assert.strictEqual(regRes.jsonData.user.email, 'jane@linkpilot.ai');
    assert.strictEqual(db.users.length, 1);
    assert.strictEqual(db.workspaces.length, 1);
    assert.strictEqual(db.subscriptions.length, 1);
    
    console.log('✅ User Registration passed successfully.');

    // -------------------------------------------------------------
    // Test 1.5: User Email Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 1.5: User Email Verification ---');
    
    const verificationToken = jwt.sign(
      { email: 'jane@linkpilot.ai' },
      process.env.JWT_SECRET || 'linkpilot_jwt_secret_key_987654321_abcdef',
      { expiresIn: '1d' }
    );
    
    const verifyReq = createMockReq({
      body: {
        email: 'jane@linkpilot.ai',
        token: verificationToken
      }
    });
    const verifyRes = createMockRes();
    
    await verifyEmail(asHandlerReq(verifyReq), asHandlerRes(verifyRes), testNext);
    
    assert.strictEqual(verifyRes.statusCode, 200);
    assert.strictEqual(verifyRes.jsonData.success, true);
    assert.strictEqual(db.users[0].isVerified, true);
    
    console.log('✅ User Email Verification passed successfully.');

    // -------------------------------------------------------------
    // Test 2: User Login
    // -------------------------------------------------------------
    console.log('\n--- Test 2: User Login ---');
    
    // Test 2a: Invalid credentials
    const loginFailReq = createMockReq({
      body: {
        email: 'jane@linkpilot.ai',
        password: 'wrongPassword'
      }
    });
    const loginFailRes = createMockRes();
    await login(asHandlerReq(loginFailReq), asHandlerRes(loginFailRes), testNext);
    assert.strictEqual(loginFailRes.statusCode, 401);
    assert.strictEqual(loginFailRes.jsonData.success, false);
    assert.strictEqual(loginFailRes.jsonData.message, 'Invalid credentials');
    
    // Test 2b: Successful login
    const loginSuccessReq = createMockReq({
      body: {
        email: 'jane@linkpilot.ai',
        password: 'securePassword123'
      }
    });
    const loginSuccessRes = createMockRes();
    await login(asHandlerReq(loginSuccessReq), asHandlerRes(loginSuccessRes), testNext);
    assert.strictEqual(loginSuccessRes.statusCode, 200);
    assert.strictEqual(loginSuccessRes.jsonData.success, true);
    assert.ok(loginSuccessRes.jsonData.accessToken);
    assert.strictEqual(loginSuccessRes.jsonData.user.name, 'Jane Doe');
    
    console.log('✅ User Login passed successfully.');

    // -------------------------------------------------------------
    // Test 3: Connect LinkedIn Account
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Connect LinkedIn Profile ---');
    const user = db.users[0];
    
    const connReq = createMockReq({
      user: { id: String(user._id), _id: String(user._id) },
      body: {
        name: 'Jane LinkedIn Profile',
        avatar: 'https://avatar.url/jane.png',
        linkedinId: 'li_jane_123'
      }
    });
    const connRes = createMockRes();
    
    await connectAccount(asHandlerReq(connReq), asHandlerRes(connRes), testNext);
    
    assert.strictEqual(connRes.statusCode, 200);
    assert.strictEqual(connRes.jsonData.success, true);
    assert.strictEqual(connRes.jsonData.data.name, 'Jane LinkedIn Profile');
    assert.strictEqual(db.accounts.length, 1);
    
    console.log('✅ Connect Account passed successfully.');

    // -------------------------------------------------------------
    // Test 4: Create & Schedule Post
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Create Scheduled Post ---');
    const account = db.accounts[0];
    
    const postReq = createMockReq({
      user: { id: String(user._id), _id: String(user._id) },
      body: {
        content: 'Sharing some automated LinkedIn insights! #automation',
        scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        linkedinAccounts: [String(account._id)],
        status: 'scheduled'
      }
    });
    const postRes = createMockRes();
    
    await createPost(asHandlerReq(postReq), asHandlerRes(postRes), testNext);
    
    assert.strictEqual(postRes.statusCode, 201);
    assert.strictEqual(postRes.jsonData.success, true);
    assert.strictEqual(postRes.jsonData.data.content, 'Sharing some automated LinkedIn insights! #automation');
    assert.strictEqual(db.posts.length, 1);
    
    console.log('✅ Create Scheduled Post passed successfully.');

    // -------------------------------------------------------------
    // Test 5: List Scheduled Posts
    // -------------------------------------------------------------
    console.log('\n--- Test 5: List Scheduled Posts ---');
    
    const listReq = createMockReq({
      user: { id: String(user._id), _id: String(user._id) },
      query: { tab: 'scheduled' }
    });
    const listRes = createMockRes();
    
    await getPosts(asHandlerReq(listReq), asHandlerRes(listRes), testNext);
    
    assert.strictEqual(listRes.statusCode, 200);
    assert.strictEqual(listRes.jsonData.success, true);
    assert.strictEqual(listRes.jsonData.data.length, 1);
    const populatedAccount = listRes.jsonData.data[0].linkedinAccounts[0] as unknown as { name: string };
    assert.strictEqual(populatedAccount.name, 'Jane LinkedIn Profile');
    
    console.log('✅ List Scheduled Posts passed successfully.');

    // -------------------------------------------------------------
    // Test 6: Playwright LinkedIn Automation Simulator
    // -------------------------------------------------------------
    console.log('\n--- Test 6: LinkedIn Automation Simulator ---');
    
    const scheduledPost = db.posts[0] as {
      content: string;
      media: { url: string; type: 'image' | 'video' }[];
      _id: { toString(): string };
    };
    
    // Simulate successful publish
    const publishResult = await publishToLinkedIn(
      scheduledPost.content,
      scheduledPost.media,
      'mock_oauth_token_123',
      scheduledPost._id.toString()
    );
    
    assert.strictEqual(publishResult.success, true);
    assert.ok(publishResult.urn);
    
    // Simulate failed publish
    const failResult = await publishToLinkedIn(
      'trigger_mock_failure and error out',
      scheduledPost.media,
      'mock_oauth_token_123',
      scheduledPost._id.toString()
    );
    
    assert.strictEqual(failResult.success, false);
    assert.ok(failResult.error);
    
    console.log('✅ Playwright LinkedIn Simulator passed successfully.');
    
    // -------------------------------------------------------------
    // Test 7: OAuth URL Generation
    // -------------------------------------------------------------
    console.log('\n--- Test 7: OAuth URL Generation ---');
    const oauthUrlReq = createMockReq();
    const oauthUrlRes = createMockRes();
    
    await getOAuthUrls(asHandlerReq(oauthUrlReq), asHandlerRes(oauthUrlRes), testNext);
    assert.strictEqual(oauthUrlRes.statusCode, 200);
    assert.strictEqual(oauthUrlRes.jsonData.success, true);
    assert.strictEqual(oauthUrlRes.jsonData.isGoogleMock, true);
    assert.strictEqual(oauthUrlRes.jsonData.isLinkedinMock, true);
    console.log('✅ OAuth URL Generation passed successfully.');

    // -------------------------------------------------------------
    // Test 8: Google Sign-In Simulation
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Google Sign-In Simulation ---');
    const googleLoginReq = createMockReq({
      body: {
        code: 'mock_google_code_test',
        email: 'testoauth@google.com',
        name: 'Google Test User'
      }
    });
    const googleLoginRes = createMockRes();
    
    await googleLogin(asHandlerReq(googleLoginReq), asHandlerRes(googleLoginRes), testNext);
    assert.strictEqual(googleLoginRes.statusCode, 200);
    assert.strictEqual(googleLoginRes.jsonData.success, true);
    assert.ok(googleLoginRes.jsonData.accessToken);
    assert.strictEqual(googleLoginRes.jsonData.user.email, 'testoauth@google.com');
    assert.strictEqual(googleLoginRes.jsonData.user.isVerified, true);
    
    const registeredUser = db.users.find(u => u.email === 'testoauth@google.com');
    assert.ok(registeredUser);
    assert.ok(registeredUser.googleId);
    assert.strictEqual(registeredUser.isVerified, true);
    
    console.log('✅ Google Sign-In Simulation passed successfully.');

    // -------------------------------------------------------------
    // Test 9: LinkedIn Sign-In Simulation
    // -------------------------------------------------------------
    console.log('\n--- Test 9: LinkedIn Sign-In Simulation ---');
    const linkedinLoginReq = createMockReq({
      body: {
        code: 'mock_linkedin_code_test',
        email: 'testoauth@linkedin.com',
        name: 'LinkedIn Test User'
      }
    });
    const linkedinLoginRes = createMockRes();
    
    await linkedinLogin(asHandlerReq(linkedinLoginReq), asHandlerRes(linkedinLoginRes), testNext);
    assert.strictEqual(linkedinLoginRes.statusCode, 200);
    assert.strictEqual(linkedinLoginRes.jsonData.success, true);
    assert.ok(linkedinLoginRes.jsonData.accessToken);
    assert.strictEqual(linkedinLoginRes.jsonData.user.email, 'testoauth@linkedin.com');
    assert.strictEqual(linkedinLoginRes.jsonData.user.isVerified, true);
    
    const registeredLiUser = db.users.find(u => u.email === 'testoauth@linkedin.com');
    assert.ok(registeredLiUser);
    assert.ok(registeredLiUser.linkedinId);
    
    console.log('✅ LinkedIn Sign-In Simulation passed successfully.');

    // -------------------------------------------------------------
    // Test 10: Local Password Login Rejection on Social Accounts
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Local Login Rejection on Social Accounts ---');
    const socialUserLoginReq = createMockReq({
      body: {
        email: 'testoauth@google.com',
        password: 'anyPassword'
      }
    });
    const socialUserLoginRes = createMockRes();
    
    await login(asHandlerReq(socialUserLoginReq), asHandlerRes(socialUserLoginRes), testNext);
    assert.strictEqual(socialUserLoginRes.statusCode, 400);
    assert.strictEqual(socialUserLoginRes.jsonData.success, false);
    const msg = socialUserLoginRes.jsonData.message as string;
    assert.ok(msg.includes('social provider'));
    
    console.log('✅ Local Login Rejection on Social Accounts passed successfully.');

    console.log('\n🎉 ALL LINKPILOT INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Integration Test Failed with exception:');
    console.error(error);
    process.exit(1);
  }
}

runTests();
