"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const RelayServiceClientPb_1 = require("../proto/proto/RelayServiceClientPb");
const relay_pb_1 = require("../proto/proto/relay_pb");
class Relayer {
    constructor(consumerSession, chainID, privKey) {
        // For demo use static relayer address
        this.relayerGrpcWeb = "http://localhost:8081";
        this.activeConsumerSession = consumerSession;
        this.chainID = chainID;
        this.privKey = privKey;
    }
    setConsumerSession(consumerSession) {
        this.activeConsumerSession = consumerSession;
    }
    sendRelay(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const stringifyMethod = JSON.stringify(method);
            const stringifyParam = JSON.stringify(params);
            // Create relay client
            const client = new RelayServiceClientPb_1.RelayerClient(this.relayerGrpcWeb, null, null);
            // Get consumer session
            const consumerSession = this.activeConsumerSession;
            var enc = new TextEncoder();
            const data = '{"jsonrpc": "2.0", "id": 1, "method": ' +
                stringifyMethod +
                ', "params": ' +
                stringifyParam +
                "}";
            // Create request
            const request = new relay_pb_1.RelayRequest();
            request.setChainid(this.chainID);
            request.setConnectionType("");
            request.setApiUrl("");
            request.setSessionId(consumerSession.getNewSessionId()); //Every time generate new session
            request.setCuSum(10);
            request.setSig(new Uint8Array());
            request.setData(data);
            request.setProvider(consumerSession.Endpoint.Addr);
            request.setBlockHeight(consumerSession.PairingEpoch);
            request.setRelayNum(consumerSession.RelayNum);
            request.setRequestBlock(0);
            request.setUnresponsiveProviders(new Uint8Array());
            // Sign data
            const signedMessage = yield this.signRelay(request, this.privKey);
            // Add signature in the request
            request.setSig(signedMessage);
            request.setData(enc.encode(data));
            const relayResponse = yield client.relay(request, null);
            return relayResponse;
        });
    }
    // Sign relay request using priv key
    signRelay(request, privKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.prepareRequest(request);
            const sig = yield crypto_1.Secp256k1.createSignature(message, (0, encoding_1.fromHex)(privKey));
            const recovery = sig.recovery;
            const r = sig.r();
            const s = sig.s();
            // TODO consider adding compression in the signing
            // construct signature
            // <(byte of 27+public key solution)>< padded bytes for signature R><padded bytes for signature S>
            return Uint8Array.from([27 + recovery, ...r, ...s]);
        });
    }
    prepareRequest(request) {
        var enc = new TextEncoder();
        var jsonMessage = JSON.stringify(request.toObject(), (key, value) => {
            if (value !== null && value !== 0 && value !== "")
                return value;
        });
        const messageReplaced = jsonMessage
            .replace(/,"/g, ' "')
            .replace(/"(\w+)"\s*:/g, "$1:")
            .slice(1, -1);
        const encodedMessage = enc.encode(messageReplaced + " ");
        const hash = (0, crypto_1.sha256)(encodedMessage);
        return hash;
    }
}
exports.default = Relayer;