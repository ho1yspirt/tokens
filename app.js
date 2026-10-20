// =============================================================================
// Progressive Gold 1 (PGOLD1) · Proganize-Style Soft Neo-Brutalist Dashboard
// =============================================================================

const CONFIG = {
  chainId: 11155111n,
  hexChainId: '0xaa36a7',
  chainName: 'Ethereum Sepolia Testnet',
  tokenAddress: '0x33Af3BB30Cf56C55BDDaDCfC9F40BB97f7F3a085',
  tokenName: 'Progressive Gold 1',
  tokenSymbol: 'PGOLD1',
  tokenDecimals: 18,
  tokenTotalSupply: 100000n * (10n ** 18n),
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

// App State
let currentAccount = null;
let currentChainId = null;
let rawTokenBalance = 0n;
let formattedTokenBalance = '0';
let formattedEthBalance = '0';
let isSubmitting = false;

// DOM References
const dom = {
  walletPill: document.getElementById('walletPill'),
  walletAvatar: document.getElementById('walletAvatar'),
  walletPillText: document.getElementById('walletPillText'),
  networkStatusBadge: document.getElementById('networkStatusBadge'),
  networkBadgeText: document.getElementById('networkBadgeText'),
  cardPgoldBalance: document.getElementById('cardPgoldBalance'),
  cardEthBalance: document.getElementById('cardEthBalance'),
  ringUserPct: document.getElementById('ringUserPct'),
  refreshBalancesBtn: document.getElementById('refreshBalancesBtn'),
  sidebarSendBtn: document.getElementById('sidebarSendBtn'),
  transferForm: document.getElementById('transferForm'),
  recipientInput: document.getElementById('recipientInput'),
  amountInput: document.getElementById('amountInput'),
  shortcutProfBtn: document.getElementById('shortcutProfBtn'),
  shortcutOneBtn: document.getElementById('shortcutOneBtn'),
  shortcutMaxBtn: document.getElementById('shortcutMaxBtn'),
  transferFeedback: document.getElementById('transferFeedback'),
  submitTransferBtn: document.getElementById('submitTransferBtn'),
  submitBtnText: document.getElementById('submitBtnText'),
  activityStack: document.getElementById('activityStack'),
  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMsg: document.getElementById('toastMsg')
};

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
let toastTimer = null;
function showToast(msg, icon = 'ℹ️') {
  clearTimeout(toastTimer);
  dom.toastIcon.textContent = icon;
  dom.toastMsg.textContent = msg;
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 4500);
}

// =============================================================================
// WEB3 & WALLET MANAGEMENT
// =============================================================================
async function initWeb3() {
  if (!window.ethereum) {
    dom.walletPillText.textContent = 'Install MetaMask';
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    }

    const hexId = await window.ethereum.request({ method: 'eth_chainId' });
    currentChainId = BigInt(hexId);

    updateUI();
    if (currentAccount) {
      await loadBalances();
    }
  } catch (err) {
    console.error('Initialization error:', err);
  }

  window.ethereum.on('accountsChanged', (accounts) => {
    currentAccount = accounts.length > 0 ? accounts[0] : null;
    updateUI();
    if (currentAccount) loadBalances();
  });

  window.ethereum.on('chainChanged', (hexId) => {
    currentChainId = BigInt(hexId);
    updateUI();
    if (currentAccount) loadBalances();
  });
}

async function connectWallet() {
  if (!window.ethereum) {
    showToast('MetaMask not detected. Please install extension!', '⚠️');
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

    showToast('MetaMask connected!', '✅');
    updateUI();
    await loadBalances();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Connection failed', '❌');
  }
}

async function switchToSepolia() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CONFIG.hexChainId }]
    });
  } catch (switchError) {
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
        console.error(addError);
      }
    }
  }
}

// =============================================================================
// UI SYNC
// =============================================================================
function updateUI() {
  const isSepolia = currentChainId === CONFIG.chainId;

  // Network badge
  if (isSepolia) {
    dom.networkStatusBadge.className = 'network-badge';
    dom.networkBadgeText.textContent = 'Sepolia (11155111)';
    dom.networkStatusBadge.onclick = null;
  } else {
    dom.networkStatusBadge.className = 'network-badge warning';
    dom.networkBadgeText.textContent = 'Switch to Sepolia';
    dom.networkStatusBadge.onclick = switchToSepolia;
  }

  // Wallet pill
  if (currentAccount) {
    const truncated = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    dom.walletPillText.textContent = truncated;
    dom.walletAvatar.textContent = currentAccount.substring(2, 4).toUpperCase();
    dom.walletPill.onclick = () => {
      navigator.clipboard.writeText(currentAccount);
      showToast('Wallet address copied to clipboard!', '📋');
    };
  } else {
    dom.walletPillText.textContent = 'Connect Wallet';
    dom.walletAvatar.textContent = 'P';
    dom.walletPill.onclick = connectWallet;
  }
}

// =============================================================================
// LOAD BALANCES
// =============================================================================
async function loadBalances() {
  if (!window.ethereum || !currentAccount) return;

  dom.refreshBalancesBtn.style.transform = 'rotate(180deg)';
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Fetch SepoliaETH
    const ethRaw = await provider.getBalance(currentAccount);
    formattedEthBalance = parseFloat(ethers.formatEther(ethRaw)).toFixed(3);
    dom.cardEthBalance.textContent = `${formattedEthBalance}`;

    // Fetch PGOLD1
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, provider);
    rawTokenBalance = await tokenContract.balanceOf(currentAccount);
    formattedTokenBalance = ethers.formatUnits(rawTokenBalance, CONFIG.tokenDecimals);

    const prettyTokens = parseFloat(formattedTokenBalance).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    dom.cardPgoldBalance.textContent = prettyTokens;

    // Calculate percentage share
    if (CONFIG.tokenTotalSupply > 0n) {
      const pct = (Number(rawTokenBalance * 1000n / CONFIG.tokenTotalSupply) / 10).toFixed(1);
      dom.ringUserPct.textContent = `${pct}%`;
    }

  } catch (err) {
    console.error('Error loading balances:', err);
  } finally {
    setTimeout(() => {
      dom.refreshBalancesBtn.style.transform = 'rotate(0deg)';
    }, 300);
  }
}

// =============================================================================
// TRANSFER LOGIC
// =============================================================================
async function handleTransfer(e) {
  e.preventDefault();
  clearFeedback();

  if (!currentAccount) {
    setFeedback('Please connect your MetaMask wallet first.', 'error');
    return;
  }

  if (currentChainId !== CONFIG.chainId) {
    setFeedback('Please switch MetaMask to Ethereum Sepolia.', 'error');
    return;
  }

  const recipient = dom.recipientInput.value.trim();
  const amountStr = dom.amountInput.value.trim();

  // Validate address
  if (!recipient || !ethers.isAddress(recipient)) {
    setFeedback('Invalid recipient Ethereum address format.', 'error');
    dom.recipientInput.classList.add('error');
    return;
  } else {
    dom.recipientInput.classList.remove('error');
  }

  // Validate amount
  if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
    setFeedback('Please enter a valid amount greater than 0.', 'error');
    dom.amountInput.classList.add('error');
    return;
  } else {
    dom.amountInput.classList.remove('error');
  }

  let parsedAmount;
  try {
    parsedAmount = ethers.parseUnits(amountStr, CONFIG.tokenDecimals);
  } catch (err) {
    setFeedback('Invalid precision for 18-decimal token.', 'error');
    return;
  }

  if (parsedAmount > rawTokenBalance) {
    setFeedback(`Insufficient balance. You have ${formattedTokenBalance} PGOLD1.`, 'error');
    return;
  }

  // Execute transfer
  setSubmitting(true);
  showToast('Confirm transfer in MetaMask...', '🦊');

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, signer);

    const tx = await tokenContract.transfer(recipient, parsedAmount);

    setFeedback(`Transaction broadcast! Waiting for block confirmation...`, 'success');
    showToast('Transaction submitted to Sepolia!', '⏳');

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      setFeedback(`Transfer of ${amountStr} PGOLD1 confirmed on Sepolia!`, 'success');
      showToast('Transfer completed successfully!', '🎉');

      // Add to recent activities
      addActivity({
        recipient,
        amount: amountStr,
        txHash: tx.hash,
        isLecturer: recipient.toLowerCase() === CONFIG.lecturerAddress.toLowerCase()
      });

      dom.amountInput.value = '';
      await loadBalances();
    } else {
      throw new Error('Transaction reverted on-chain.');
    }
  } catch (err) {
    console.error('Transfer error:', err);
    let msg = err.reason || err.message || 'Transaction failed';
    if (err.code === 'ACTION_REJECTED' || (err.info && err.info.error && err.info.error.code === 4001)) {
      msg = 'Transaction rejected in MetaMask.';
    }
    setFeedback(msg, 'error');
    showToast(msg, '❌');
  } finally {
    setSubmitting(false);
  }
}

function setFeedback(msg, type) {
  dom.transferFeedback.textContent = msg;
  dom.transferFeedback.className = `feedback-banner ${type}`;
}

function clearFeedback() {
  dom.transferFeedback.textContent = '';
  dom.transferFeedback.className = 'feedback-banner';
  dom.recipientInput.classList.remove('error');
  dom.amountInput.classList.remove('error');
}

function setSubmitting(loading) {
  isSubmitting = loading;
  dom.submitTransferBtn.disabled = loading;
  dom.submitBtnText.textContent = loading ? 'Confirming on Sepolia...' : 'Confirm & Send Transfer';
}

function addActivity({ recipient, amount, txHash, isLecturer }) {
  const truncated = `${recipient.substring(0, 8)}...${recipient.substring(recipient.length - 6)}`;
  const item = document.createElement('div');
  item.className = 'activity-pill-card blue';
  item.innerHTML = `
    <div class="activity-avatar" style="background: #93c5fd;">💸</div>
    <div class="activity-text">
      <strong>${isLecturer ? 'Lecturer Transfer' : 'Token Transfer'}:</strong> Sent ${amount} PGOLD1
      <div style="font-size: 11px; opacity: 0.8;">To: ${truncated} · <a href="${CONFIG.explorerUrl}/tx/${txHash}" target="_blank" style="color: inherit; text-decoration: underline;">Tx receipt</a></div>
    </div>
    <div class="activity-time">Just now</div>
  `;
  dom.activityStack.prepend(item);
}

// =============================================================================
// SHORTCUTS & EVENT LISTENERS
// =============================================================================
dom.shortcutProfBtn.onclick = () => {
  dom.recipientInput.value = CONFIG.lecturerAddress;
  clearFeedback();
  showToast('Lecturer address populated', '🎓');
};

dom.shortcutOneBtn.onclick = () => {
  dom.amountInput.value = '1.0';
  clearFeedback();
};

dom.shortcutMaxBtn.onclick = () => {
  if (formattedTokenBalance && parseFloat(formattedTokenBalance) > 0) {
    dom.amountInput.value = formattedTokenBalance;
    clearFeedback();
  }
};

dom.sidebarSendBtn.onclick = () => {
  dom.recipientInput.focus();
  dom.recipientInput.scrollIntoView({ behavior: 'smooth' });
};

dom.refreshBalancesBtn.onclick = loadBalances;
dom.transferForm.onsubmit = handleTransfer;

window.addEventListener('DOMContentLoaded', initWeb3);
