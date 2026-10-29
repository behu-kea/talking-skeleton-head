import test from 'node:test';
import assert from 'node:assert/strict';
import { openAIError, elevenError } from '../src/api-errors.js';
test('quota failures are distinct from rate limits', async()=>{
 assert.match(await openAIError({status:429,json:async()=>({error:{code:'insufficient_quota'}})}),/API-kredit/);
 assert.match(await openAIError({status:429,json:async()=>({error:{code:'rate_limit_exceeded'}})}),/hastighedsgrænse/);
});
test('paid voice restrictions are explained without exposing provider details',()=>{
 assert.match(elevenError({statusCode:400,body:{detail:{status:'free_users_not_allowed'}}}),/Creator/);
 assert.doesNotMatch(elevenError({statusCode:400,message:'secret request data'}),/secret/);
});
