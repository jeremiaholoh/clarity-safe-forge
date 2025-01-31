import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure that only contract owner can register templates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get('deployer')!;
    const user = accounts.get('wallet_1')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge',
        'register-template',
        [types.ascii("TestTemplate"), types.ascii("1.0.0")],
        owner.address
      ),
      Tx.contractCall(
        'safe-forge',
        'register-template',
        [types.ascii("TestTemplate2"), types.ascii("1.0.0")],
        user.address
      )
    ]);

    assertEquals(block.receipts.length, 2);
    assertEquals(block.height, 2);
    
    // First tx (owner) should succeed
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Second tx (non-owner) should fail
    block.receipts[1].result.expectErr().expectUint(100);
  },
});

Clarinet.test({
  name: "Ensure template validation works correctly and prevents double validation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get('deployer')!;

    let block = chain.mineBlock([
      Tx.contractCall(
        'safe-forge',
        'register-template',
        [types.ascii("TestTemplate"), types.ascii("1.0.0")],
        owner.address
      ),
      Tx.contractCall(
        'safe-forge',
        'validate-template',
        [types.uint(1)],
        owner.address
      ),
      Tx.contractCall(
        'safe-forge',
        'validate-template',
        [types.uint(1)],
        owner.address
      )
    ]);

    assertEquals(block.receipts.length, 3);
    
    // Check template registration
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Check first validation success
    block.receipts[1].result.expectOk().expectBool(true);

    // Check second validation fails
    block.receipts[2].result.expectErr().expectUint(103);
  },
});
