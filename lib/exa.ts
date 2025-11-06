import Exa from 'exa-js';

const exaApiKey = process.env.EXA_API_KEY ?? process.env.EXASEARCH_API_KEY;

if (!exaApiKey) {
	throw new Error('Missing EXA API key. Set EXA_API_KEY or EXASEARCH_API_KEY in your environment.');
}

export const exa = new Exa(exaApiKey);
