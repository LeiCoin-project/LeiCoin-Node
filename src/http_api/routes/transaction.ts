import Elysia from "elysia";
import { type Transaction } from "@advena/common/models/transaction";
import { HTTPRouter405Route } from "../route.js";
import { Mempool } from "@advena/storage/mempool";
import { Verification } from "@advena/verification";

const router = new Elysia({prefix: '/sendTransactions'})

.use(HTTPRouter405Route())

// Route for receiving new transactions
.post('/', async({set, body}) => {
	const transactionData = body as Transaction;

	// Validate the transaction (add your validation logic here)
	const validationresult = await Verification.verifyTransaction(transactionData);

	if (validationresult !== 12000) {
		set.status = 400;
		return Response.json({message: Verification.Codes[validationresult]});
	}

	// Add the transaction to the mempool (replace with your blockchain logic)
	Mempool.addTransactionToMempool(transactionData);

	return Response.json({code: validationresult, message: 'Transaction added to the mempool'});
});

export const sendTransactions_route = router;
