import { Verification } from "@advena/verification";
import { Blockchain } from "@advena/storage/blockchain";
import Elysia from "elysia";
import { type Block } from "@advena/common/models/block";
import { HTTPRouter405Route } from "../route.js";
import { Mempool } from "@advena/storage/mempool";

const router = new Elysia({prefix: '/sendBlocks'})

.use(HTTPRouter405Route())

// Route for receiving new transactions
.post('/', async ({set, body}) => {
    const blockData = body as Block;
	
	// Validate the transaction (add your validation logic here)
	const validationresult = await Verification.verifyBlock(blockData);

    set.status = validationresult.status;

	if (validationresult.status !== 12000) {
		return Response.json({ code: validationresult.status, message: Verification.Codes[validationresult.status] });
	}

    // Add the transaction to the mempool (replace with your blockchain logic)
    Blockchain.blocks.add(blockData);
    //Blockchain.updateLatestBlockInfo(blockData.index, blockData.hash);
    Mempool.clearMempoolbyBlock(blockData);

    return Response.json({ code: validationresult.status, message: 'Block added to the blockchain' });
});

export const sendBlocks_route = router;
