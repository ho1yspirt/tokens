# Gold13 (MTK) · Sepolia Token Dashboard

Educational ERC-20 token project and public web dashboard for Ethereum Sepolia, built with **Material UI (MUI)** and **ethers.js v6**.

- **Author / GitHub:** [ho1yspirt](https://github.com/ho1yspirt)
- **Live GitHub Pages Dashboard:** [https://ho1yspirt.github.io/tokens/](https://ho1yspirt.github.io/tokens/)
- **Network:** Ethereum Sepolia (Chain ID: `11155111` / `0xaa36a7`)

---

## 🪙 Token Specifications

| Property | Value |
|---|---|
| **Token Name** | Gold13 |
| **Token Symbol** | MTK |
| **Decimals** | 18 |
| **Total Supply** | 10,000 MTK (`10000 * 10^18` base units) |
| **Contract Address** | [`0x34DEcdc5c452E9A16Ca8Dd185feAD1Bb9fcE4780`](https://sepolia.etherscan.io/address/0x34DEcdc5c452E9A16Ca8Dd185feAD1Bb9fcE4780) |
| **Explorer** | [Sepolia Etherscan Contract Page](https://sepolia.etherscan.io/address/0x34DEcdc5c452E9A16Ca8Dd185feAD1Bb9fcE4780) |

The Solidity source code is available at [`contracts/Gold13.sol`](contracts/Gold13.sol).

---

## 🎓 Mandatory Lecturer Transfer Proof

As required by the assignment guidelines, at least 1.0 whole token has been sent to the lecturer's Sepolia destination wallet:

- **Lecturer Destination Wallet:** [`0x5f3046bD5aA3c6d4575AF09B8198d584f130708E`](https://sepolia.etherscan.io/address/0x5f3046bD5aA3c6d4575AF09B8198d584f130708E)
- **Amount Transferred:** 1.0 MTK (`1000000000000000000` base units)
- **Status:** Success
- **Transaction Hash:** [`0x7360e9ff7dcb67e80acedb6f7fd34471d2a0813d640f637103dc4903e37fd8d6`](https://sepolia.etherscan.io/tx/0x7360e9ff7dcb67e80acedb6f7fd34471d2a0813d640f637103dc4903e37fd8d6)

---

## 🎨 Material UI Web Dashboard Features

The dashboard is built using modern **Material UI** design components:
1. **MetaMask Wallet Integration**:
   - One-click wallet connection and account status indicator.
   - Truncated address chip with clipboard copy function.
2. **Sepolia Network Enforcement**:
   - Detects chain ID. If not on Sepolia (`11155111`), shows a prominent Material UI `Alert` and a button to automatically switch networks via MetaMask (`wallet_switchEthereumChain`).
3. **Live Token & Gas Balances**:
   - Displays real-time ERC-20 `Gold13 (MTK)` token balance formatted with 18 decimals.
   - Displays live SepoliaETH balance to ensure sufficient gas for transactions.
   - Manual balance refresh icon button.
4. **Safe Transfer Form**:
   - Pre-validation of recipient Ethereum address using `ethers.isAddress`.
   - "Fill Professor Address" shortcut button.
   - "MAX" button for rapid amount input.
   - Zero-amount and balance-overflow safety checks before prompting MetaMask.
   - Progress spinner (`CircularProgress`) while awaiting block confirmation.
5. **Transaction History & Snackbars**:
   - Displays on-chain transaction receipts with direct links to Sepolia Etherscan.
   - Success / error toast notifications.

---

## 🚀 Repository Structure

```
tokens/
├── index.html        # Main HTML entrypoint with Material UI & ethers v6
├── app.js            # React application with Material UI components & Web3 logic
├── contracts/
│   └── Gold13.sol    # OpenZeppelin ERC-20 contract for Gold13 (MTK)
└── README.md         # Documentation and verification proof
```

---

## 🛠️ GitHub Pages Deployment

To publish this dashboard to GitHub Pages under your account `ho1yspirt`:

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: initial token dashboard with Material UI"
   ```
2. Create a repository named `tokens` on GitHub and link the remote:
   ```bash
   git remote add origin git@github.com:ho1yspirt/tokens.git
   git branch -M main
   git push -u origin main
   ```
3. Enable GitHub Pages:
   - Go to your repository on GitHub: **Settings → Pages**.
   - Under **Build and deployment → Source**, select **Deploy from a branch**.
   - Choose branch **`main`** and folder **`/ (root)`**, then click **Save**.
   - Your site will be live at: `https://ho1yspirt.github.io/tokens/`
