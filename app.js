// =============================================================================
// Progressive Gold 1 (PGOLD1) · Material 3 Expressive Dashboard Engine
// =============================================================================

const CONFIG = {
  chainId: 11155111n,
  hexChainId: '0xaa36a7',
  chainName: 'Ethereum Sepolia Testnet',
  tokenAddress: '0x33Af3BB30Cf56C55BDDaDCfC9F40BB97f7F3a085',
  tokenName: 'Progressive Gold 1',
  tokenSymbol: 'PGOLD1',
  tokenDecimals: 18,
  tokenTotalSupply: '100,000 PGOLD1',
  lecturerAddress: '0x5f3046bD5aA3c6d4575AF09B8198d584f130708E',
  lecturerTxHash: '0xa399c984fcc3ddae149f7191cbf3034ddfca4b76c8709cf2fbe9974ba5707f3c',
  rpcUrl: 'https://rpc.sepolia.org',
  explorerUrl: 'https://sepolia.etherscan.io'
};

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Application State
let currentAccount = null;
let currentChainId = null;
let rawTokenBalance = 0n;
let formattedTokenBalance = '0';
let formattedEthBalance = '0';
let isSubmitting = false;

// DOM Element References
const dom = {
  networkPill: document.getElementById('networkPill'),
  networkText: document.getElementById('networkText'),
  connectWalletBtn: document.getElementById('connectWalletBtn'),
  connectBtnText: document.getElementById('connectBtnText'),
  wrongNetworkBanner: document.getElementById('wrongNetworkBanner'),
  switchNetworkBtn: document.getElementById('switchNetworkBtn'),
  unconnectedPrompt: document.getElementById('unconnectedPrompt'),
  promptConnectBtn: document.getElementById('promptConnectBtn'),
  balancesContainer: document.getElementById('balancesContainer'),
  userPgoldBalance: document.getElementById('userPgoldBalance'),
  userRawUnits: document.getElementById('userRawUnits'),
  userEthBalance: document.getElementById('userEthBalance'),
  availableBalanceNote: document.getElementById('availableBalanceNote'),
  refreshBalancesBtn: document.getElementById('refreshBalancesBtn'),
  copyContractBtn: document.getElementById('copyContractBtn'),
  copyLecturerAddressBtn: document.getElementById('copyLecturerAddressBtn'),
  transferForm: document.getElementById('transferForm'),
  recipientInput: document.getElementById('recipientInput'),
  amountInput: document.getElementById('amountInput'),
  recipientValidationMsg: document.getElementById('recipientValidationMsg'),
  fillProfessorBtn: document.getElementById('fillProfessorBtn'),
  maxAmountBtn: document.getElementById('maxAmountBtn'),
  fillOneTokenBtn: document.getElementById('fillOneTokenBtn'),
  transferErrorBanner: document.getElementById('transferErrorBanner'),
  submitTransferBtn: document.getElementById('submitTransferBtn'),
  btnIcon: document.getElementById('btnIcon'),
  btnText: document.getElementById('btnText'),
  txList: document.getElementById('txList'),
  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMsg: document.getElementById('toastMsg')
};

// =============================================================================
// NOTIFICATION TOAST
// =============================================================================
let toastTimeout = null;
function showToast(message, icon = 'info', linkUrl = null, linkText = 'View') {
  clearTimeout(toastTimeout);
  dom.toastIcon.textContent = icon;
  
  if (linkUrl) {
    dom.toastMsg.innerHTML = `${message} <a href="${linkUrl}" target="_blank">${linkText} ↗</a>`;
  } else {
    dom.toastMsg.textContent = message;
  }

  dom.toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 5000);
}

// Copy to Clipboard helper
function copyText(text, label) {
  navigator.clipboard.writeText(text);
  showToast(`${label} copied to clipboard!`, 'check_circle');
}

// =============================================================================
// METAMASK / WEB3 INITIALIZATION
// =============================================================================
async function initWeb3() {
  if (!window.ethereum) {
    console.warn('MetaMask not detected in browser');
    return;
  }

  try {
    // Check existing accounts
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    }

    // Check chain
    const hexId = await window.ethereum.request({ method: 'eth_chainId' });
    currentChainId = BigInt(hexId);

    updateUI();
    if (currentAccount) {
      await loadBalances();
    }
  } catch (err) {
    console.error('Failed to initialize web3:', err);
  }

  // Event Listeners
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    } else {
      currentAccount = null;
    }
    updateUI();
    if (currentAccount) loadBalances();
  });

  window.ethereum.on('chainChanged', (hexId) => {
    currentChainId = BigInt(hexId);
    updateUI();
    if (currentAccount) loadBalances();
  });
}

// Connect Wallet Action
async function connectWallet() {
  if (!window.ethereum) {
    showToast('MetaMask not detected. Please install MetaMask!', 'error');
    window.open('https://metamask.io/download/', '_blank');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    }
    const hexId = await window.ethereum.request({ method: 'eth_chainId' });
    currentChainId = BigInt(hexId);

    showToast('MetaMask connected successfully!', 'check_circle');
    updateUI();
    await loadBalances();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to connect MetaMask', 'error');
  }
}

// Switch Chain Action
async function switchToSepolia() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CONFIG.hexChainId }]
    });
  } catch (switchError) {
    // 4902: Chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CONFIG.hexChainId,
            chainName: CONFIG.chainName,
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: [CONFIG.rpcUrl, 'https://ethereum-sepolia-rpc.publicnode.com'],
            blockExplorerUrls: [CONFIG.explorerUrl]
          }]
        });
      } catch (addError) {
        console.error('Failed to add Sepolia chain:', addError);
      }
    }
  }
}

// =============================================================================
// UI STATE UPDATES
// =============================================================================
function updateUI() {
  const isSepolia = currentChainId === CONFIG.chainId;

  // Network pill
  if (currentAccount) {
    dom.networkPill.style.display = 'inline-flex';
    if (isSepolia) {
      dom.networkPill.className = 'badge-pill success';
      dom.networkText.textContent = 'Sepolia (11155111)';
      dom.wrongNetworkBanner.style.display = 'none';
    } else {
      dom.networkPill.className = 'badge-pill warning';
      dom.networkText.textContent = 'Wrong Network';
      dom.wrongNetworkBanner.style.display = 'block';
    }
  } else {
    dom.networkPill.style.display = 'none';
    dom.wrongNetworkBanner.style.display = 'none';
  }

  // Connect button / account badge
  if (currentAccount) {
    const truncated = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    dom.connectBtnText.textContent = truncated;
    dom.connectWalletBtn.onclick = () => copyText(currentAccount, 'Wallet address');
    dom.unconnectedPrompt.style.display = 'none';
    dom.balancesContainer.style.display = 'block';
  } else {
    dom.connectBtnText.textContent = 'Connect MetaMask';
    dom.connectWalletBtn.onclick = connectWallet;
    dom.unconnectedPrompt.style.display = 'block';
    dom.balancesContainer.style.display = 'none';
  }
}

// =============================================================================
// LOAD ON-CHAIN BALANCES
// =============================================================================
async function loadBalances() {
  if (!window.ethereum || !currentAccount) return;

  dom.refreshBalancesBtn.style.transform = 'rotate(180deg)';
  dom.refreshBalancesBtn.style.transition = 'transform 0.4s ease';

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Fetch SepoliaETH
    const ethRaw = await provider.getBalance(currentAccount);
    formattedEthBalance = parseFloat(ethers.formatEther(ethRaw)).toFixed(4);
    dom.userEthBalance.textContent = `${formattedEthBalance} ETH`;

    // Fetch PGOLD1
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, provider);
    rawTokenBalance = await tokenContract.balanceOf(currentAccount);
    formattedTokenBalance = ethers.formatUnits(rawTokenBalance, CONFIG.tokenDecimals);

    const prettyTokens = parseFloat(formattedTokenBalance).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });

    dom.userPgoldBalance.textContent = prettyTokens;
    dom.userRawUnits.textContent = `${rawTokenBalance.toString()} base units`;
    dom.availableBalanceNote.textContent = `Available: ${prettyTokens} PGOLD1`;

  } catch (err) {
    console.error('Error fetching on-chain balances:', err);
  } finally {
    setTimeout(() => {
      dom.refreshBalancesBtn.style.transform = 'rotate(0deg)';
    }, 400);
  }
}

// =============================================================================
// SAFE TRANSFER SUBMISSION
// =============================================================================
async function handleTransfer(e) {
  e.preventDefault();
  hideError();

  if (!currentAccount) {
    showError('Please connect your MetaMask wallet first.');
    return;
  }

  if (currentChainId !== CONFIG.chainId) {
    showError('Please switch MetaMask to Ethereum Sepolia (11155111).');
    return;
  }

  const recipient = dom.recipientInput.value.trim();
  const amountStr = dom.amountInput.value.trim();

  // Validate address
  if (!recipient || !ethers.isAddress(recipient)) {
    showError('Invalid recipient address. Please enter a valid 42-character 0x address.');
    dom.recipientInput.classList.add('error');
    return;
  } else {
    dom.recipientInput.classList.remove('error');
  }

  // Validate amount
  if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
    showError('Transfer amount must be greater than 0.');
    dom.amountInput.classList.add('error');
    return;
  } else {
    dom.amountInput.classList.remove('error');
  }

  let parsedAmount;
  try {
    parsedAmount = ethers.parseUnits(amountStr, CONFIG.tokenDecimals);
  } catch (err) {
    showError('Invalid amount decimal precision.');
    return;
  }

  if (parsedAmount > rawTokenBalance) {
    showError(`Insufficient PGOLD1 balance. You have ${formattedTokenBalance} PGOLD1.`);
    return;
  }

  // Initiate Transaction
  setTransferLoading(true);
  showToast('Please confirm transaction in your MetaMask wallet...', 'wallet');

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, signer);

    const tx = await tokenContract.transfer(recipient, parsedAmount);

    showToast('Transaction submitted! Awaiting block confirmation...', 'hourglass_top', `${CONFIG.explorerUrl}/tx/${tx.hash}`);

    // Wait for 1 confirmation
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      showToast(`Successfully transferred ${amountStr} PGOLD1!`, 'check_circle', `${CONFIG.explorerUrl}/tx/${tx.hash}`);

      // Record to recent activity feed
      addTxToActivity({
        hash: tx.hash,
        recipient: recipient,
        amount: amountStr,
        label: recipient.toLowerCase() === CONFIG.lecturerAddress.toLowerCase() ? 'Lecturer Transfer' : 'Token Transfer'
      });

      // Clear input & refresh balance
      dom.amountInput.value = '';
      await loadBalances();
    } else {
      throw new Error('Transaction reverted on-chain.');
    }
  } catch (err) {
    console.error('Transfer execution error:', err);
    let msg = err.reason || err.message || 'Transaction failed';
    if (err.code === 'ACTION_REJECTED' || (err.info && err.info.error && err.info.error.code === 4001)) {
      msg = 'Transaction rejected in MetaMask.';
    }
    showError(msg);
    showToast(msg, 'error');
  } finally {
    setTransferLoading(false);
  }
}

function showError(msg) {
  dom.transferErrorBanner.textContent = msg;
  dom.transferErrorBanner.style.display = 'block';
}

function hideError() {
  dom.transferErrorBanner.style.display = 'none';
  dom.recipientInput.classList.remove('error');
  dom.amountInput.classList.remove('error');
}

function setTransferLoading(loading) {
  isSubmitting = loading;
  dom.submitTransferBtn.disabled = loading;
  if (loading) {
    dom.btnIcon.textContent = 'hourglass_top';
    dom.btnText.textContent = 'Confirming on Sepolia...';
  } else {
    dom.btnIcon.textContent = 'send';
    dom.btnText.textContent = 'Send PGOLD1';
  }
}

function addTxToActivity({ hash, recipient, amount, label }) {
  const truncatedRecipient = `${recipient.substring(0, 8)}...${recipient.substring(recipient.length - 6)}`;
  const item = document.createElement('div');
  item.className = 'tx-item';
  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span class="material-symbols-rounded" style="color: var(--md-sys-color-tertiary); font-size: 24px;">check_circle</span>
      <div>
        <div style="font-size: 14px; font-weight: 700;">${label}</div>
        <div style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-family: 'Roboto Mono', monospace;">To: ${truncatedRecipient}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: 800; color: var(--md-sys-color-primary);">-${amount} PGOLD1</div>
      <a href="${CONFIG.explorerUrl}/tx/${hash}" target="_blank" style="font-size: 11px; color: var(--md-sys-color-secondary); text-decoration: none;">
        Etherscan ↗
      </a>
    </div>
  `;
  dom.txList.prepend(item);
}

// =============================================================================
// EVENT LISTENERS BINDING
// =============================================================================
dom.promptConnectBtn.onclick = connectWallet;
dom.switchNetworkBtn.onclick = switchToSepolia;
dom.refreshBalancesBtn.onclick = loadBalances;

dom.copyContractBtn.onclick = () => copyText(CONFIG.tokenAddress, 'Contract address');
dom.copyLecturerAddressBtn.onclick = () => copyText(CONFIG.lecturerAddress, 'Professor wallet address');

// Input helpers
dom.fillProfessorBtn.onclick = () => {
  dom.recipientInput.value = CONFIG.lecturerAddress;
  hideError();
  showToast('Professor Sepolia address populated', 'school');
};

dom.maxAmountBtn.onclick = () => {
  if (formattedTokenBalance && parseFloat(formattedTokenBalance) > 0) {
    dom.amountInput.value = formattedTokenBalance;
    hideError();
  }
};

dom.fillOneTokenBtn.onclick = () => {
  dom.amountInput.value = '1.0';
  hideError();
};

dom.recipientInput.oninput = () => {
  const val = dom.recipientInput.value.trim();
  if (val && !ethers.isAddress(val)) {
    dom.recipientValidationMsg.textContent = 'Invalid address format';
  } else {
    dom.recipientValidationMsg.textContent = '';
  }
};

dom.transferForm.onsubmit = handleTransfer;

// Start Web3
window.addEventListener('DOMContentLoaded', initWeb3);
