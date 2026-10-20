# Progressive Gold 1 (PGOLD1) · Sepolia Token Dashboard

Official Ethereum Sepolia ERC-20 token project and public web dashboard for RTU Blockchain Lab, designed using Google's **Material 3 Expressive** design system and powered by **ethers.js v6**.

- **Author / GitHub:** [ho1yspirt](https://github.com/ho1yspirt)
- **Live GitHub Pages Dashboard:** [https://ho1yspirt.github.io/tokens/](https://ho1yspirt.github.io/tokens/)
- **Network:** Ethereum Sepolia (Chain ID: `11155111` / `0xaa36a7`)

---

## 🪙 Token Specifications

| Parameter | Value |
|---|---|
| **Token Name** | Progressive Gold 1 |
| **Token Symbol** | PGOLD1 |
| **Decimals** | 18 |
| **Total Supply** | 100,000 PGOLD1 (`100000 * 10^18` base units) |
| **Contract Address** | [`0x33Af3BB30Cf56C55BDDaDCfC9F40BB97f7F3a085`](https://sepolia.etherscan.io/address/0x33Af3BB30Cf56C55BDDaDCfC9F40BB97f7F3a085) |
| **Explorer** | [Sepolia Etherscan Token Page](https://sepolia.etherscan.io/address/0x33Af3BB30Cf56C55BDDaDCfC9F40BB97f7F3a085) |

Solidity smart contract source: [`contracts/ProgressiveGold1.sol`](contracts/ProgressiveGold1.sol).

---

## 🎓 Mandatory Lecturer Transfer Proof

As required by the professor's assignment specifications, the tokens were transferred to the designated Sepolia lecturer address:

- **Lecturer Destination Wallet:** [`0x5f3046bD5aA3c6d4575AF09B8198d584f130708E`](https://sepolia.etherscan.io/address/0x5f3046bD5aA3c6d4575AF09B8198d584f130708E)
- **Amount Transferred:** 100.0 PGOLD1 (`100000000000000000000` base units)
- **Status:** Success
- **Transaction Hash:** [`0xa399c984fcc3ddae149f7191cbf3034ddfca4b76c8709cf2fbe9974ba5707f3c`](https://sepolia.etherscan.io/tx/0xa399c984fcc3ddae149f7191cbf3034ddfca4b76c8709cf2fbe9974ba5707f3c)

---

## 🎨 Material 3 Expressive Features

The user interface follows the latest **Google Material 3 Expressive** guidelines:
- **Expressive Tokens & Color Roles:** High-contrast Gold brand accent (`#f5be38`), Deep Obsidian surfaces (`#0a0e17`), Cyan secondary accents (`#7bd0ff`), and Emerald confirmation highlights.
- **M3 Expressive Pill & Container Shapes:** Full pill shapes (`border-radius: 9999px`) for action buttons, chips, and toasts; `28px` rounded container cards with surface tonal elevation.
- **Web3 Wallet Integration:**
  - One-click MetaMask connection with account status chip and instant address copying.
  - Automatic chain detection for Ethereum Sepolia (`11155111`).
  - Seamless "Switch to Sepolia" fallback trigger with `wallet_switchEthereumChain` and `wallet_addEthereumChain`.
- **Live Balances & Metrics:**
  - Real-time `PGOLD1` balance with decimal normalization.
  - Native SepoliaETH gas balance display.
  - Smooth animation on manual balance refresh.
- **Safe Transfer Form:**
  - Real-time recipient address validation via `ethers.isAddress`.
  - "Fill Professor Address" shortcut button.
  - "MAX" balance autofill.
  - Pre-flight checks preventing negative amounts, zero transfers, or balance overflows.
  - Live transaction progress tracking and direct links to Sepolia Etherscan.

---

## 📁 Repository Structure

```
tokens/
├── index.html                  # Material 3 Expressive frontend
├── app.js                      # Core dApp logic with ethers.js v6
├── contracts/
│   └── ProgressiveGold1.sol    # OpenZeppelin ERC-20 contract
└── README.md                   # Verification and deployment guide
```

---

## 🚀 Deployment Instructions for `ho1yspirt`

1. Create a public repository named `tokens` on GitHub:
   👉 **[https://github.com/new](https://github.com/new)** (Name: `tokens`, Public)

2. Push the files to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Material 3 Expressive dashboard for PGOLD1"
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to: **Settings → Pages**.
   - Under **Build and deployment → Source**, choose **Deploy from a branch**.
   - Select branch **`main`** and folder **`/ (root)`**, then click **Save**.
   - Your live site will be ready at: **`https://ho1yspirt.github.io/tokens/`**
