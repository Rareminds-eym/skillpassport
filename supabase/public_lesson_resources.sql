SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict wXC3zDVw9heTfCWfOmi2hLYIKXMGkIFyykgkgWPlYFZ90Xj8yWFCDwB1hKgN4eJ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: lesson_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lesson_resources" ("resource_id", "lesson_id", "name", "type", "url", "file_size", "thumbnail_url", "embed_url", "order_index", "created_at", "content") VALUES
	('e4b6f3c5-a842-45b6-8da0-679b4691a159', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', '3141208-uhd_3840_2160_25fps.mp4', 'video', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737426823-e07d5c120e4f4f56.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251203%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251203T045049Z&X-Amz-Expires=604800&X-Amz-Signature=20fad4901079ad62e63048a1416fa3e1c75cc1e3a9361c8c4ea0698c9767c410&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', '59.82 MB', NULL, NULL, 0, '2025-12-03 04:50:49.879842+00', NULL),
	('aeda82a2-2e23-4468-8097-fe940d72b8e6', '5317fb02-8b75-4d5c-8fb0-2ce918f4c707', 'What is Blockchain.pdf', 'pdf', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/5317fb02-8b75-4d5c-8fb0-2ce918f4c707/1764737379714-1c634b4e7c0fbb17.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251203%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251203T044942Z&X-Amz-Expires=604800&X-Amz-Signature=174b4fcf2d0d8501551aced0916eca77a3779be1d2f9494bd31afde18071db6b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', '3.78 MB', NULL, NULL, 0, '2025-12-03 04:49:42.699898+00', '[Page 1/105]
(No text content on this page - may contain images)

---

[Page 2/105]
BLOCKCHAIN What is Blockchain w w w . b l o c k c h a i n t r a i n i n g a l l i a n c e . c o m © Copyright 2017 | All Right Reserved

---

[Page 3/105]
No prior knowledge of blockchains required We’ll be looking at Bitcoin, but mostly talking Blockchain Start with a simplified overview of how it all works, then dive deeper into each section LETS START AT THE BEGINNING

---

[Page 4/105]
© Copyright 2017 | All Right ReservedPage 4 OVERVIEW  Class time: (2 pm – 6 pm)  6 modules organized into  45 minute sessions  5 min Q&A (flexible)  10 minute break  Start at top of the hour  Instructor available for additional Q&A at end of call

---

[Page 5/105]
© Copyright 2017 | All Right ReservedPage 5 OVERVIEW and OBJECTIVES  Objectives  What is blockchain, technical overview, business use cases  Modules to cover 1. What is Blockchain 2. Money and Decentralized Networks 3. Blockchain Basics 4. Blockchain Transactions 5. Use Cases 6. Implementation  Materials, Certificate of Completion, Feedback

---

[Page 6/105]
INTRODUCTION & PRIMER What you need to know

---

[Page 7/105]
© Copyright 2017 | All Right ReservedPage 7 What is Blockchain?  Blockchain technology is a software; a protocol for the secure transfer of unique instances of value (e.g. money, property, contracts, and identity credentials) via the internet without requiring a third-party intermediary such as a bank or government  Email over IP, Voice over IP, Money over IP Internet Blockchain Bitcoin Application Protocol Infrastructure SMTP Email VoIP Phone calls

---

[Page 8/105]
© Copyright 2017 | All Right ReservedPage 8 How does Bitcoin work? Use eWallet app to submit transaction Source: https://www.youtube.com/watch?v=t5JGQXCTe3c Scan recipient’s address and submit transaction $ appears in recipient’s eWallet Wallet has keys not money Creates PKI Signature address pairs A new PKI hashed signature for each transaction

---

[Page 9/105]
© Copyright 2017 | All Right ReservedPage 9 P2P network confirms & records transactions Source: https://www.youtube.com/watch?v=t5JGQXCTe3c Transaction computationally confirmed Ledger account balances updated Peer nodes maintain distributed ledger Transactions submitted to mempool, and miners assemble new batch (block) of transactions each 10 min Each block includes a cryptographic hash of the last block, chaining the blocks, hence “Blockchain”

---

[Page 10/105]
© Copyright 2017 | All Right ReservedPage 10 How robust is the Bitcoin p2p network? p2p: peer to peer; Source: https://bitnodes.21.co, https://github.com/bitcoin/bitcoin • 11,678 global nodes run full Bitcoind (2/18); 160 gb

---

[Page 11/105]
© Copyright 2017 | All Right ReservedPage 11 What is Bitcoin mining? Mining is the accounting function to record transactions, fee-based ($130,000/block each 10 min) Mining ASICs “discover new blocks” Mining software makes nonce guesses to win the right to record a new block (“discover a block”) At the rate of 2^32 (4 billion) hashes (guesses)/second One machine at random guesses the 32-bit nonce Winning machine confirms and records the transactions, and collects the rewards All nodes confirm the transactions and append the new block to their copy of the distributed ledger “Wasteful” effort deters malicious players Run the software yourself: Fast because ASICs represent the hashing algorithm as hardware

---

[Page 12/105]
© Copyright 2017 | All Right ReservedPage 12 Key Blockchain Concepts Public-private networks Trustless vs trusted Distributed network Consensus algorithms Immutability Blockchain: trustless, distributed (peer- based), consensus-driven, immutable

---

[Page 13/105]
© Copyright 2017 | All Right ReservedPage 13 What is a Ledger? A ledger is like a database, a Google or Excel spreadsheet Add new records by appending rows Each row contains information Account balances, who owns certain assets Memory and execution state of a computer program

---

[Page 14/105]
© Copyright 2017 | All Right ReservedPage 14 Why Distributed? Distributed network Many nodes or peers that are connected in a network with no single point of failure or centralized control Security and resiliency: design the network so that if some peers crash or attack the network maliciously, the network can still operate (Byzantine Fault Tolerance)

---

[Page 15/105]
© Copyright 2017 | All Right ReservedPage 15 What is Immutable? Cannot change the data once its committed to the ledger Data is auditable Change by issuing offsetting transaction Smart contract code

---

[Page 16/105]
© Copyright 2017 | All Right ReservedPage 16 Cryptographic Identity To use the network, need a Cryptographic Identity (sort of like an email address) If want to access your email, you need the password, which functions similarly to a private key and your public key is like your address (more complicated) Authentication: peers sign transactions with their cryptographic identity, this enables account “ownership” and can attribute blame

---

[Page 17/105]
© Copyright 2017 | All Right ReservedPage 17 Consensus in Distributed Networks In order to update the ledger, the network needs to come to consensus using an algorithm Consensus: what does it mean to come to consensus on a distributed network? It means that everyone agrees on the current state (e.g. how much money does each account have) and making sure that no one is double-spending money (easy in Bitcoin, more complex in Ethereum, business networks) How do we come to consensus in this distributed manner?

---

[Page 18/105]
© Copyright 2017 | All Right ReservedPage 18 Three Primary Consensus Algorithms POW: Proof of Work (Bitcoin) Expensive, not ecological, wasteful computation POS: Proof of Stake (Ethereum) Next-gen: PBFT: Practical Byzantine Fault Tolerance (DFINITY, Algorand)  Law of large numbers: diversity of participants  For each block of transactions, randomly select a small, one-time group of users in a safe and fair way  To protect from attackers, the identities of these users are hidden until the block is confirmed  The size of this group remains constant as the network grows

---

[Page 19/105]
© Copyright 2017 | All Right ReservedPage 19 Key Blockchain Concepts Public-private networks Trustless vs trusted Distributed network Consensus algorithms Immutability Blockchain: trustless, distributed (peer- based), consensus-driven, immutable

---

[Page 20/105]
© Copyright 2017 | All Right ReservedPage 20 What problem does Blockchain solve? ⦿ Trip to the Bar

---

[Page 21/105]
© Copyright 2017 | All Right ReservedPage 21 What is Blockchain ⦿ Common Ledger

---

[Page 22/105]
© Copyright 2017 | All Right ReservedPage 22 What is Blockchain ⦿ A More Common Ledger

---

[Page 23/105]
BLOCKCHAIN ADOPTION One of the fastest-moving technology adoptions

---

[Page 24/105]
© Copyright 2017 | All Right ReservedPage 24 Blockchain Adoption  Blockchain (distributed ledger technology) is being considered by more than half of the world''s big corporations, according to a Juniper market research survey released Jul 2017  57 percent of large corporations – defined as any company with more than 20,000 employees – were either actively considering or in the process of deploying blockchain  Two-thirds of companies surveyed by Juniper said that they expected the technology to be integrated into their systems by the end of 2018  IDC: $2.1 billion estimated global blockchain spend 2018 https://www.cnbc.com/2017/07/31/blockchain-technology-considered-by-57-percent-of-big-corporations-study.html

---

[Page 25/105]
© Copyright 2017 | All Right ReservedPage 25 Blockchain Adoption https://www.slideshare.net/SebastianCochinescu/vlad-andrei-tokens-deep-dive-presentation

---

[Page 26/105]
© Copyright 2017 | All Right ReservedPage 26 The Future of Blockchain Transforming Society ⦿ Blockchain technology is bringing us the Internet of value: a new platform to reshape the world of business ⦿ It transcends all physical and geographical barriers and uses math and cryptography to enable transactions globally. ⦿ The uniqueness of blockchain lies in its capacity to store and retain person-to- person transactional history, so that chances of fraud, hacking, and third- party interference are eliminated.

---

[Page 27/105]
BLOCKCHAIN CONCEPTUAL OVERVIEW The blockchain is: • Decentralized • Immutable • Transparent • Disintermediated • Consensus-based

---

[Page 28/105]
© Copyright 2017 | All Right ReservedPage 28 Blockchain combines existing technologies to prevent the double- spend problem Cleverly combined software components  Distributed Systems  Peer-to-peer networks  Hashing functions  Public - Private key cryptography  Cryptographic signatures  Elliptic curve cryptography

---

[Page 29/105]
© Copyright 2017 | All Right ReservedPage 29 USE CASES  Background checks: education credentials, criminal records  Secure document storage: home deed, auto title  Birth registries  Land registries  Financial services: securities clearing, syndicated loans  Global supply chain: automotive recalls and counterfeit airbags  Healthcare: EMRs, insurance claims, genome research  Airlines: registration, re-booking, vouchers, loyalty  Tokenized economy: Tech Coworking space 1 token = 1 seat  Payment channels: Starbucks or for bandwidth consumption

---

[Page 30/105]
IT’S ALL ABOUT TRANSACTIONS

---

[Page 31/105]
© Copyright 2017 | All Right ReservedPage 31 CASH IS PEER TO PEER Observations:  No middleman required  DIY Fraud detection  Sufficient trust for the value of the transaction  Anonymous/Private  Distributed

---

[Page 32/105]
© Copyright 2017 | All Right ReservedPage 32 ELECTRONIC MIDDLEMEN Observations:  Requires 3rd party trust  The more complex the flow, the more middlemen required  Specialized equipment needed (e.g. POS terminal, connection to Txn networks  Fraud detection by 3rd parties  Every step adds cost Merchant Processor Networks Credit Card Bill Merchant Bank Card Issuing BATCH DAILY DEPOSIT

---

[Page 33/105]
© Copyright 2017 | All Right ReservedPage 33 MIDDLEMEN ADDING VALUE  Provision of infrastructure (Terminals, network connections, etc.)  Management of commercial relationships between parties (Lots of lawyers)  Abstraction of complexity  Fraud detection  Customer service  Regulatory compliance KYC, AML, Risk reporting  Removal of bad-actors from the ecosystem Until now, this is the best way we’ve been able to achieve the goal of person-to-person transactions at a distance.

---

[Page 34/105]
© Copyright 2017 | All Right ReservedPage 34 BLOCKCHAIN POWERED PAYMENT NETWORKS Now:  Online banking transaction growth  SME’s/Retail acceptance of electronic transactions  Online purchases/Commerce  In-App purchases  Virtual currencies in games  International Transaction growth (Commerce and Remittance)  Value storage cards (loyalty cards, ERP, gift cards etc etc) Future:  Internet of Things  Autonomous Objects  Programmable money/Finance automation

---

[Page 35/105]
IN GENERAL... The easier it is to conduct transactions the more people transact.

---

[Page 36/105]
© Copyright 2017 | All Right ReservedPage 36 LIMITATIONS  Cash is king….but only useful locally and small amounts  Electronic transactions require Credit/Debit card - Fees are high for merchants (Fixed Fee + 1-3%) - Settlement is slow (multiple days) - Chargebacks shift risk to merchant - Microtransactions are cost prohibitive  Walled garden/In-country solutions are piecemeal  International Transfers ITT/Swift - Slow, costly, mistake prone  High onboarding costs/bureaucracy

---

[Page 37/105]
2 billion world-wide underbanked (PWC 2016)

---

[Page 38/105]
© Copyright 2017 | All Right ReservedPage 38 BLOCKCHAIN POWERED PAYMENT NETWORKS Solved:  Return to Peer-to-Peer  Speed  Trustless trust  No special equipment needed  Fraud  Minimal Cost  No chargebacks  No monthly fees  Transparency Ignored:  Policing bad-actors  KYC/AML  Insurance  Onboarding process  Customer service  Commercial Relationships Challenges:  Technical Complexity  Regulatory Uncertainty  Getting the currency in the first place

---

[Page 39/105]
© Copyright 2017 | All Right ReservedPage 39 MANY BLOCKCHAINS  It''s easy to create your own, and there are many.  Each is separate and runs its own blockchain  The value transferred in each blockchain is primarily its own currency

---

[Page 40/105]
WHAT IS A BLOCKCHAIN? What you need to know

---

[Page 41/105]
IT ALL STARTS HERE

---

[Page 42/105]
JUST GOING SHOPPING...

---

[Page 43/105]
A CENTRALISED LEDGER

---

[Page 44/105]
IMPORTING THE STONES

---

[Page 45/105]
© Copyright 2017 | All Right ReservedPage 45 SOME INTERESTING OBSERVATIONS  The stones themselves had no non-monetary value  Eventually, spending your stones didn''t require physically moving the stone – just acknowledgement of a change of ownership  Impossible to do a trade in secret  They developed a form of distributed ledger, but...  It couldn''t scale!

---

[Page 46/105]
© Copyright 2017 | All Right ReservedPage 46 A BLOCKCHAIN IS AN IMPLEMENTATION OF A LEDGER  Ledgers record transactions - the passing of value from owner to owner  Transactions are time based  Once a Txn is recorded you can’t alter them  You need to be able to detect if your ledger has been altered A blockchain is a protocol for building an immutable historical record of transactions

---

[Page 47/105]
BLOCKCHAINS ARE DISTRIBUTED

---

[Page 48/105]
© Copyright 2017 | All Right ReservedPage 48 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized

---

[Page 49/105]
© Copyright 2017 | All Right ReservedPage 49 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized 

---

[Page 50/105]
© Copyright 2017 | All Right ReservedPage 50 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized        

---

[Page 51/105]
© Copyright 2017 | All Right ReservedPage 51 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                 

---

[Page 52/105]
© Copyright 2017 | All Right ReservedPage 52 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                  

---

[Page 53/105]
© Copyright 2017 | All Right ReservedPage 53 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                         

---

[Page 54/105]
© Copyright 2017 | All Right ReservedPage 54 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                          

---

[Page 55/105]
© Copyright 2017 | All Right ReservedPage 55 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                           

---

[Page 56/105]
© Copyright 2017 | All Right ReservedPage 56 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                            

---

[Page 57/105]
© Copyright 2017 | All Right ReservedPage 57 NETWORK EVOLUTION i) centralized iii) distributed ii) decentralized                                              

---

[Page 58/105]
© Copyright 2017 | All Right ReservedPage 58 DISTRIBUTED NETWORKS  Many, equal nodes  Each node has multiple connections to other nodes  Very resilient to failures, attacks  As long as 2 nodes are up, the network is still running

---

[Page 59/105]
WHO INVENTED IT?

---

[Page 60/105]
© Copyright 2017 | All Right ReservedPage 60 KEY HISTORICAL DATES  2009 first block created  Satoshi Nakamoto was the pseudonym used  Early days, it was just him/her/them/it  Then crypto-geeks, then early technology adopters  Satoshi disappears December 2010 - date of last post  Recent years have seen ''professionalism'' of the ecosystem

---

[Page 61/105]
© Copyright 2017 | All Right ReservedPage 61 SEEKING SATOSHI  Not this guy! (probably)  Not a great coder  Not a great cryptographer  Aware of the controversy blockchains create

---

[Page 62/105]
© Copyright 2017 | All Right ReservedPage 62 SEEKING SATOSHI  While conspiracy theories are fun, it''s mostly irrelevant  Operational design published openly  Protocol is opensource  Code is opensource and has mostly been re-written

---

[Page 63/105]
IS IT MONEY? Digital cash? Digital gold?

---

[Page 64/105]
© Copyright 2017 | All Right ReservedPage 64 HAS ALL THE SAME CHARACTERISTICS  Durability -  Portability -  Divisibility -  Uniformity -  Limited supply -  Acceptability - Safe for long term storage Easy to move around and spend So you can spend small amounts Each unit of value is equal To preserve value So you can actually spend it

---

[Page 65/105]
© Copyright 2017 | All Right ReservedPage 65 IS IT LEGAL TENDER? Legal tender is defined as “coins or banknotes that must be accepted if offered in payment of a debt.”Fiat money is currency that a government has declared to be legal tender, but it is not backed by a physical commodity. Cryptocurrencies aren’t regulated by any central bank. NO!

---

[Page 66/105]
© Copyright 2017 | All Right ReservedPage 66 SO WHAT? Lots of things aren’t legal tender but still have value:  Gold  Diamonds  Rolex watch  US$ (outside the US)

---

[Page 67/105]
© Copyright 2017 | All Right ReservedPage 67 WORLDS MOST EXPENSIVE PIZZA? 22nd May 2010 is Bitcoin Pizza day – bitcoins first real world transaction  Laszlo Hanyecz offered 10,000 BTC for 2 pizzas  Someone in the UK phoned through the order using their credit card  Then worth US ~$24  Currently worth US ~$2.4m

---

[Page 68/105]
ECOSYSTEM DEVELOPMENTS One of the fasting moving in tech

---

[Page 69/105]
© Copyright 2017 | All Right ReservedPage 69 PARALLELS TO THE INTERNET Blockchains today have been likened to the Internet in 90s.  Similar investment levels  Similar excitement levels  Similar visions of potential uses History doesn’t repeat, but it rhymes: We expect similar...  Similar path to maturity – people, tools, process  Similar adoption curve (perhaps faster)  Evolution of protocol/services built on blockchains (perhaps faster)

---

[Page 70/105]
© Copyright 2017 | All Right ReservedPage 70 PARALLELS TO THE INTERNET Just as the internet revolutionised access to information, blockchains will do the same to multiple industrial verticals:  Finance first - It''s what blockchains were built to do - It''s where the money is Non finance uses  Specialist blockchains dedicated to one task  Generalist blockchains to be used as a ''platform‘ Brave new world/wild west – still lots of learn and build

---

[Page 71/105]
© Copyright 2017 | All Right ReservedPage 71 WHERE ARE WE NOW? General Public Developers

---

[Page 72/105]
© Copyright 2017 | All Right ReservedPage 72 INVESTMENT INTO THE SECTOR  Reid Hoffman (LinkedIn) Invested US$20M in Blockstream Personally  Sir Richard Branson backed BitPay (Exchange) in a US$30 Million Round  Circle (Exchange) raised US$50 Million - led by Goldman Sachs  NYSE led a US$75 Million Investment in Coinbase (Exchange)  US$1 Billion from VC funding is expected in 2015  Although this is a small cross section,  the importance is the names, not the numbers!

---

[Page 73/105]
© Copyright 2017 | All Right ReservedPage 73 EVOLUTION OF THE NETWORKS 1st generation networks transfer value - bitcoin, litecoin, dogecoin Blockchain 1.5 technologies build upon existing blockchains by offering additional dependent layers and protocols allowing for unique offerings:  NameCoin provides distributed DNS  ColoredCoin, Counterparty and Omni can tag and track digital assets  FileCoin and StorJ provide distributed CDN (content delivery network) with proof of bandwidth

---

[Page 74/105]
© Copyright 2017 | All Right ReservedPage 74 EVOLUTION OF THE NETWORKS Blockchain 2.0 is currently in a mostly theoretical or pre-alpha state but involves starting from scratch and introducing turing-complete functionality  Ethetherum and Codius introduce autonomous applications (recently used by IBM at the core of their new IoT platform - ADEPT) Curated blockchains, Private access/Hybrid blockchains, entry/exit points are known & regulated  Ripple  Tembusu

---

[Page 75/105]
© Copyright 2017 | All Right ReservedPage 75 FORECAST FOR TOTAL BITCOIN WALLETS BY END OF 2015 MAINTAINED AT 12 MILLION

---

[Page 76/105]
© Copyright 2017 | All Right ReservedPage 76 BITCOIN TRANSACTIONS HAVE BEEN RISING; AVERAGE OF 10,000 DAILY TRANSACTIONS BY POPULAR ADDRESSES*

---

[Page 77/105]
© Copyright 2017 | All Right ReservedPage 77 Growth in CryptoAddresses

---

[Page 78/105]
© Copyright 2017 | All Right ReservedPage 78 WALL STREET INTEREST IN BITCOIN IS GROWING

---

[Page 79/105]
BLOCKCHAIN ECONOMICS Rethinking Economics with Computer Science Principles and Network Models

---

[Page 80/105]
Blockchain Investing 80 Source: https://cointelegraph.com/news/why-bitcoin-continues-to-be-on-the-top-of-its-game

---

[Page 81/105]
© Copyright 2017 | All Right ReservedPage 81 Cryptographic Asset Class https://www.slideshare.net/SebastianCochinescu/vlad-andrei-tokens-deep-dive-presentation

---

[Page 82/105]
ICOs = “crypto-daytrading”? • $3.5 bn cumulative ICO funding (Coindesk) • ICOs surpass VC funding (PitchBook) • ICOs: $3.5 bn, VC funding: $2.7 bn (2/14-10/17) • Tokens: many functions beyond fundraising • Voting, dividends, access, participation, notification 82 Source: https://www.coindesk.com/ico-tracker, https://pitchbook.com/news/reports/3q-2017-fintech-analyst-note- blockchain Cumulative ICO Funding 2/3/14 - 10/31/17

---

[Page 83/105]
ICO Regulatory Stance • US: investor protection; regulated (Jul 2017) • ICOs and exchanges; what about smart contracts? • ICOs vs token sales (network utility) vs crowdfunding • Howey Test: is it a security? 1. Investment of money 2. Expectation of profits from the investment 3. The investment of money is in a common enterprise 4. Any profit comes from the efforts of a promoter or third party • International Climate • Singapore MAS: ICOs may be securities per Singapore''s Securities and Futures Act (SFA) and the Financial Advisers Act • UK: caveat emptor; safer if regulated, not regulated • China: banned, exchanges ordered to close (Sep 2017) • Russia: regulation expected by end 2017 (Sep 2017) • Reg Arb: Gibraltar DLT Regulated Entities (2018e) 83 Source: https://www.coindesk.com/ico-tracker, https://www.coindesk.com/china-outlaws-icos-financial-regulators-order-halt-token- trading/

---

[Page 84/105]
Cryptocurrency Market Capitalizations (2/18) 84 Source: https://coinmarketcap.com, http://us.spindices.com/indices/equity/sp-500; List of countries by GDP (nominal) - Wikipedia • S&P 500: $22.2 tn; US GDP $18.8 tn • Crypto market cap: $481 bn (≃ top 50th of 200 countries)

---

[Page 85/105]
Regulated Futures & Options 1. LedgerX Options • Cleared $1m (week 1), $2m (week 2) • NY-based CFTC-regulated Swap Execution Facility (SEF) and Derivatives Clearing Organization (DCO) • Swap execution facility, clearing Bitcoin options • Sep 2017 began providing physically-settled put and call options and day-ahead swaps trading • Private trading for large customers 85 Source: https://www.bloomberg.com/news/articles/2017-07-24/bitcoin-options-to-become-available-in-fall-after-cftc-approval

---

[Page 86/105]
Regulated Futures & Options 2. CBOE Bitcoin futures contracts – 12/10/17 • Cash-settled, pending CFTC review • Settlement based on Gemini Trust data 3. CME Bitcoin futures contracts – 12/18/17 • Cash-settled • Settlement based on CME CF Bitcoin Reference Rate (BRR), launched in November 2016 with London-based Crypto Facilities trading platform • Significance: cryptocurrency exposure in an institutional product, demand could be large 86 Source: https://www.cnbc.com/2017/10/31/cme-plans-to-launch-bitcoin-futures-by-year-end.html

---

[Page 87/105]
Institutional Markets • Exposure to cryptographic assets • Asset class current value: $200 billion • Estimated value in 10 years: $2 trillion • Demand for regulated products • Dark pools (institutional exchanges for Contracts- for-Difference, private trading, block trades; $20m+) • Genesis Trading, Cumberland Mining, Circle, Gemini Exchange, Project Omni • Regulated Futures and Options • LedgerX, CME, CBOE • Regulated ICOs 87 Source: https://bitcoinmagazine.com/articles/op-ed-blockchain-economy-ushering-new-world-economic-order, https://www.coindesk.com/standpoint-founder-bitcoin-asset-class-will-grow-2-trillion-market/

---

[Page 88/105]
© Copyright 2017 | All Right ReservedPage 88 Asset Tokenization https://www.slideshare.net/SebastianCochinescu/vlad-andrei-tokens-deep-dive-presentation Tokenization: process of turning an asset, right, or digital good into an interchangeable unit to power an ecosystem Token: a more complicated and feature-rich form of money

---

[Page 89/105]
participation 89 information internet: static information social internet: engage with content token internet: participate in the community economy

---

[Page 90/105]
TECHNOLOGY SUMMARY Building blocks

---

[Page 91/105]
© Copyright 2017 | All Right ReservedPage 91 SOME BUILDING BLOCKS  Blockchain terminology  Hash functions  Merkle trees  Encoding schemes  Public/Private key crypto  Digital Signatures

---

[Page 92/105]
© Copyright 2017 | All Right ReservedPage 92 TERMINOLOGY  Address: The ‘account number’ of the person you are sending coins to. Can be used just once or multiple times. You can have many addresses  Transaction: The transfer of value/coins from one address to another address  Block/Blockchain: The record of transactions  Wallet: Software that manages your addresses and keeps track of transactions and balances

---

[Page 93/105]
© Copyright 2017 | All Right ReservedPage 93 HASHING FUNCTIONS ‘A hash function is any function that can be used to map digital data of arbitrary size to digital data of fixed size. The values returned by a hash function are called hash values, hash codes, hash sums, or hashes.’ There are many types, but Bitcoin uses SHA256; output is 256bits of data, or 64 hexadecimal characters

---

[Page 94/105]
© Copyright 2017 | All Right ReservedPage 94 HASHING PROPERTIES  Any size of data always results in the same length hash  Slight changes of input data gives totally different hashes - ‘Hello World’ = a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e - ‘Hello World!’ = 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069  The same input always produces the same output  Hashes are ‘one way’

---

[Page 95/105]
© Copyright 2017 | All Right ReservedPage 95 HASHING USAGES  To record a value while hiding the original value (e.g. a password)  To verify the integrity of some data (store the hash, to check the data, hash it again and compare the values; should be the same hash value)  To prove you’ve done calculations (generating hashes takes computing power)

---

[Page 96/105]
© Copyright 2017 | All Right ReservedPage 96 MERKLE TREE - HASH OF HASHES  Multiple blocks of data, in a certain order, into a single hash  Allows you to work out which block has changed Top hash Hash 0 Hash 1 Hash 0-0 Hash 0-1 Hash 1-0 Hash 1-1 Data block 1 Data block 2 Data block 3 Data block 4

---

[Page 97/105]
© Copyright 2017 | All Right ReservedPage 97 A BLOCKCHAIN IS AN IMPLEMENTATION OF A LEDGER  Take some data, encode it for a specific purpose (e.g. easier to transmit, easier to read, easier to convert between formats)  Two way, you can encode and decode and end up with the same data  Bitcoin uses base 58 - easier to read (misses out 0 I O l as they all look like zeros and ones) ‘1234567890’ = 2t6V2H

---

[Page 98/105]
© Copyright 2017 | All Right ReservedPage 98 PUBLIC/PRIVATE KEY CRYPTO  2 uniquely related cryptographic keys  Data encrypted with the public key can only decrypted with the private one (and vice versa)  The maths behind it is very complex  Main aim is confidentiality (in messaging)  Also used for digital signatures (the bit we’re interested in)

---

[Page 99/105]
© Copyright 2017 | All Right ReservedPage 99 DIGITAL SIGNATURES  Verify the messages came from the correct person  Verify the messages hasn’t been changed or tampered with  Can be used to prove that you have the private key  Main aim is confidence in identity (in messaging)

---

[Page 100/105]
WAYS TO DEVELOP Nodes vs APIs

---

[Page 101/105]
© Copyright 2017 | All Right ReservedPage 101 FUNCTIONAL CATEGORIES Getting blockchain data:  Blocks  Transactions  Sending Transactions (known as relaying) Cryptocurrency functions:  Generating Private/Public keys, Hashing, Address Encoding etc  Creating transactions  Signing transactions  Support functions

---

[Page 102/105]
© Copyright 2017 | All Right ReservedPage 102 OPTIONS Run your own node:  No dependencies on external service  Lots of RPC functions you can use to  No data on addresses you don’t control (apart from BTC)  No metadata  Uptime challenge – more chains = more nodes API:  Several available  Address tracking & metadata available  Advanced functions like multi-sig/exchange functions  External dependency

---

[Page 103/105]
© Copyright 2017 | All Right ReservedPage 103 HYBRID APPROACH Run your own node for experimentation  Start on the testnet  Send initial transactions to seed your application  Watch how the transaction/data is represented through the API of your choice  Simulate external users API  Used by your main application/server/scripts Framework used for cryptocurrency functions  This stuff is hard, no need to reinvent the wheel

---

[Page 104/105]
© Copyright 2017 | All Right ReservedPage 104 USE CASES  Background checks: education credentials, criminal records  Secure document storage: home deed, auto title  Birth registries  Land registries  Financial services: securities clearing, syndicated loans  Global supply chain: automotive recalls and counterfeit airbags  Healthcare: EMRs, insurance claims, genome research  Airlines: registration, re-booking, vouchers, loyalty  Tokenized economy: Tech Coworking space 1 token = 1 seat  Payment channels: Starbucks or for bandwidth consumption

---

[Page 105/105]
THANK YOU © Copyright 2017 | All Right Reserved'),
	('bc88ac6a-db1d-4b80-af21-ae988e8d1c45', '8f9e930f-7cb7-4c75-95a0-ee37652b08fc', 'Final Video.mp4', 'video', 'https://skill-echosystem.ad91abcd16cd9e9c569d83d9ef46e398.r2.cloudflarestorage.com/courses/71a8c1e0-4087-45f1-8f8a-b7bb8978322f/lessons/8f9e930f-7cb7-4c75-95a0-ee37652b08fc/1764912705921-4f2c0ee31f0b1a28.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8796c748e9ac5127466f6b914859c42e%2F20251205%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251205T053525Z&X-Amz-Expires=604800&X-Amz-Signature=8a1415332dced559d7e30215d4498fb9ef3bc0747fee54bfcef6be84d7c701cc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject', '282.81 MB', NULL, NULL, 0, '2025-12-05 05:35:25.486549+00', NULL),
	('7b3cf1f2-d4fe-4203-95a8-066066fc4d79', '8f9e930f-7cb7-4c75-95a0-ee37652b08fc', 'Introduction To BlockChain', 'youtube', 'https://youtu.be/qQJOdRFsdsg?si=zZ-dzAgBkVrg6eUi', NULL, NULL, 'https://www.youtube.com/embed/qQJOdRFsdsg', 0, '2025-12-05 05:35:48.954509+00', NULL),
	('65ddf7ea-358c-4ff1-afc2-33049abb7409', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How Bitcoin Mining Works', 'youtube', 'https://www.youtube.com/watch?v=bBC-nXj3Ng4', NULL, NULL, 'https://www.youtube.com/embed/bBC-nXj3Ng4', 0, '2025-12-24 08:45:48.916663+00', NULL),
	('f07c7f40-1a40-42a0-9ec8-4d9aacd70eed', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Proof of Work vs Proof of Stake', 'youtube', 'https://www.youtube.com/watch?v=M3EFi_POhps', NULL, NULL, 'https://www.youtube.com/embed/M3EFi_POhps', 0, '2025-12-24 08:45:48.916663+00', NULL),
	('b7385b71-4896-4ed1-930b-0470c74f8182', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Cryptography in Blockchain Explained', 'youtube', 'https://www.youtube.com/watch?v=SSo_EIwHSd4', NULL, NULL, 'https://www.youtube.com/embed/SSo_EIwHSd4', 0, '2025-12-24 08:45:48.916663+00', NULL);


--
