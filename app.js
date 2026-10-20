// =============================================================================
// Progressive Gold 1 (PGOLD1) · Minimalist Soft-Brutalist Dashboard Engine
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
  networkPill: document.getElementById('networkPill'),
  networkText: document.getElementById('networkText'),
  walletPill: document.getElementById('walletPill'),
  walletAvatar: document.getElementById('walletAvatar'),
  walletPillText: document.getElementById('walletPillText'),
  metricTokenBalance: document.getElementById('metricTokenBalance'),
  metricRawUnits: document.getElementById('metricRawUnits'),
  metricEthBalance: document.getElementById('metricEthBalance'),
  refreshBalancesBtn: document.getElementById('refreshBalancesBtn'),
  sidebarTransferBtn: document.getElementById('sidebarTransferBtn'),
  transferForm: document.getElementById('transferForm'),
  recipientInput: document.getElementById('recipientInput'),
  amountInput: document.getElementById('amountInput'),
  fillProfBtn: document.getElementById('fillProfBtn'),
  fillOneBtn: document.getElementById('fillOneBtn'),
  fillMaxBtn: document.getElementById('fillMaxBtn'),
  transferBanner: document.getElementById('transferBanner'),
  submitTransferBtn: document.getElementById('submitTransferBtn'),
  submitBtnText: document.getElementById('submitBtnText'),
  activityList: document.getElementById('activityList'),
  toast: document.getElementById('toast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMsg: document.getElementById('toastMsg')
};

// =============================================================================
// TOAST
// =============================================================================
let toastTimer = null;
function showToast(msg, icon = 'ℹ️') {
  clearTimeout(toastTimer);
  dom.toastIcon.textContent = icon;
  dom.toastMsg.textContent = msg;
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 4000);
}

// =============================================================================
// WEB3 INITIALIZATION & WALLET
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
    dom.networkPill.className = 'badge-pill green';
    dom.networkText.textContent = 'Sepolia (11155111)';
    dom.networkPill.onclick = null;
  } else {
    dom.networkPill.className = 'badge-pill warning';
    dom.networkText.textContent = 'Switch to Sepolia';
    dom.networkPill.onclick = switchToSepolia;
  }

  // Wallet pill
  if (currentAccount) {
    const truncated = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    dom.walletPillText.textContent = truncated;
    dom.walletAvatar.textContent = currentAccount.substring(2, 4).toUpperCase();
    dom.walletPill.onclick = () => {
      navigator.clipboard.writeText(currentAccount);
      showToast('Wallet address copied!', '📋');
    };
  } else {
    dom.walletPillText.textContent = 'Connect Wallet';
    dom.walletAvatar.textContent = 'P';
    dom.walletPill.onclick = connectWallet;
  }
}

// =============================================================================
// BALANCES
// =============================================================================
async function loadBalances() {
  if (!window.ethereum || !currentAccount) return;

  dom.refreshBalancesBtn.style.transform = 'rotate(180deg)';
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Fetch SepoliaETH
    const ethRaw = await provider.getBalance(currentAccount);
    formattedEthBalance = parseFloat(ethers.formatEther(ethRaw)).toFixed(3);
    dom.metricEthBalance.textContent = formattedEthBalance;

    // Fetch PGOLD1
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, provider);
    rawTokenBalance = await tokenContract.balanceOf(currentAccount);
    formattedTokenBalance = ethers.formatUnits(rawTokenBalance, CONFIG.tokenDecimals);

    const prettyTokens = parseFloat(formattedTokenBalance).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    dom.metricTokenBalance.textContent = prettyTokens;
    dom.metricRawUnits.textContent = `${rawTokenBalance.toString()} base units`;

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
  clearBanner();

  if (!currentAccount) {
    setBanner('Please connect your MetaMask wallet first.', 'error');
    return;
  }

  if (currentChainId !== CONFIG.chainId) {
    setBanner('Please switch MetaMask to Ethereum Sepolia.', 'error');
    return;
  }

  const recipient = dom.recipientInput.value.trim();
  const amountStr = dom.amountInput.value.trim();

  // Validate address
  if (!recipient || !ethers.isAddress(recipient)) {
    setBanner('Invalid recipient address format.', 'error');
    dom.recipientInput.classList.add('error');
    return;
  } else {
    dom.recipientInput.classList.remove('error');
  }

  // Validate amount
  if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
    setBanner('Please enter an amount greater than 0.', 'error');
    dom.amountInput.classList.add('error');
    return;
  } else {
    dom.amountInput.classList.remove('error');
  }

  let parsedAmount;
  try {
    parsedAmount = ethers.parseUnits(amountStr, CONFIG.tokenDecimals);
  } catch (err) {
    setBanner('Invalid precision for 18-decimal token.', 'error');
    return;
  }

  if (parsedAmount > rawTokenBalance) {
    setBanner(`Insufficient balance. You hold ${formattedTokenBalance} PGOLD1.`, 'error');
    return;
  }

  setSubmitting(true);
  showToast('Confirm transfer in MetaMask...', '🦊');

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(CONFIG.tokenAddress, ERC20_ABI, signer);

    const tx = await tokenContract.transfer(recipient, parsedAmount);

    setBanner(`Transaction broadcast! Waiting for confirmation on Sepolia...`, 'success');
    showToast('Transaction submitted to Sepolia!', '⏳');

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      setBanner(`Transfer of ${amountStr} PGOLD1 confirmed on-chain!`, 'success');
      showToast('Transfer completed successfully!', '🎉');

      addActivityRow({
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
    setBanner(msg, 'error');
    showToast(msg, '❌');
  } finally {
    setSubmitting(false);
  }
}

function setBanner(msg, type) {
  dom.transferBanner.textContent = msg;
  dom.transferBanner.className = `banner-msg ${type}`;
}

function clearBanner() {
  dom.transferBanner.textContent = '';
  dom.transferBanner.className = 'banner-msg';
  dom.recipientInput.classList.remove('error');
  dom.amountInput.classList.remove('error');
}

function setSubmitting(loading) {
  isSubmitting = loading;
  dom.submitTransferBtn.disabled = loading;
  dom.submitBtnText.textContent = loading ? 'Confirming on Sepolia...' : 'Confirm & Send Transfer';
}

function addActivityRow({ recipient, amount, txHash, isLecturer }) {
  const truncated = `${recipient.substring(0, 8)}...${recipient.substring(recipient.length - 6)}`;
  const row = document.createElement('div');
  row.className = 'activity-row new';
  row.innerHTML = `
    <span class="activity-badge">💸</span>
    <div class="activity-body">
      <strong>${isLecturer ? 'Lecturer Transfer' : 'Transfer'}:</strong> Sent ${amount} PGOLD1
      <div style="font-size: 11px; color: #475569;">To: ${truncated} · <a href="${CONFIG.explorerUrl}/tx/${txHash}" target="_blank" class="activity-link">Receipt ↗</a></div>
    </div>
  `;
  dom.activityList.prepend(row);
}

// Shortcuts
dom.fillProfBtn.onclick = () => {
  dom.recipientInput.value = CONFIG.lecturerAddress;
  clearBanner();
  showToast('Lecturer address filled', '🎓');
};

dom.fillOneBtn.onclick = () => {
  dom.amountInput.value = '1.0';
  clearBanner();
};

dom.fillMaxBtn.onclick = () => {
  if (formattedTokenBalance && parseFloat(formattedTokenBalance) > 0) {
    dom.amountInput.value = formattedTokenBalance;
    clearBanner();
  }
};

dom.sidebarTransferBtn.onclick = () => {
  dom.recipientInput.focus();
  dom.recipientInput.scrollIntoView({ behavior: 'smooth' });
};

dom.refreshBalancesBtn.onclick = loadBalances;
dom.transferForm.onsubmit = handleTransfer;

window.addEventListener('DOMContentLoaded', initWeb3);
