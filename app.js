const {
  useState,
  useEffect,
  useCallback
} = React;

const {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Chip,
  Box,
  Alert,
  AlertTitle,
  Snackbar,
  CircularProgress,
  IconButton,
  Divider,
  Tooltip,
  Paper,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} = MaterialUI;

// Material UI Dark Theme with Cyan/Blue accent
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8', // Sky blue
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    secondary: {
      main: '#f59e0b', // Amber gold
    },
    background: {
      default: '#090d16',
      paper: '#111827',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #1e293b',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

// Constants
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';
const DEFAULT_TOKEN_ADDRESS = '0x34DEcdc5c452E9A16Ca8Dd185feAD1Bb9fcE4780'; // Gold13 (MTK)
const LECTURER_ADDRESS = '0x5f3046bD5aA3c6d4575AF09B8198d584f130708E';
const INITIAL_PROOF_TX = '0x7360e9ff7dcb67e80acedb6f7fd34471d2a0813d640f637103dc4903e37fd8d6';

// Standard ERC-20 Minimal ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

function App() {
  // Wallet state
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);

  // Token state
  const [tokenAddress, setTokenAddress] = useState(DEFAULT_TOKEN_ADDRESS);
  const [tokenInfo, setTokenInfo] = useState({
    name: 'Gold13',
    symbol: 'MTK',
    decimals: 18,
    totalSupply: '0',
    userBalance: '0',
    rawBalance: 0n,
  });
  const [loadingToken, setLoadingToken] = useState(false);

  // Transfer Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    txHash: '',
  });

  // Recent transactions list
  const [transactions, setTransactions] = useState([
    {
      hash: INITIAL_PROOF_TX,
      recipient: LECTURER_ADDRESS,
      amount: '1.0',
      symbol: 'MTK',
      timestamp: '2026-10-20 10:06 UTC',
      label: 'Lecturer Mandatory Transfer',
    }
  ]);

  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  // Initialize Web3 / MetaMask listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.request({ method: 'eth_chainId' }).then(hexId => {
        try {
          setChainId(BigInt(hexId));
        } catch (e) {
          console.error(e);
        }
      });

      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      };

      const handleChainChanged = (hexId) => {
        try {
          setChainId(BigInt(hexId));
        } catch (e) {
          console.error(e);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Fetch token details and balances
  const loadTokenData = useCallback(async () => {
    if (!window.ethereum || !tokenAddress || !ethers.isAddress(tokenAddress)) return;
    setLoadingToken(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // If wallet is connected, fetch ETH balance
      if (account) {
        const rawEth = await provider.getBalance(account);
        setEthBalance(ethers.formatEther(rawEth));
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      // Parallel contract calls
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => '???'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => 0n),
      ]);

      let userBalance = '0';
      let rawBalance = 0n;

      if (account) {
        rawBalance = await contract.balanceOf(account).catch(() => 0n);
        userBalance = ethers.formatUnits(rawBalance, decimals);
      }

      setTokenInfo({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        userBalance,
        rawBalance,
      });
    } catch (err) {
      console.error('Error fetching token data:', err);
    } finally {
      setLoadingToken(false);
    }
  }, [tokenAddress, account, chainId]);

  useEffect(() => {
    loadTokenData();
  }, [loadTokenData]);

  // Connect Wallet handler
  const handleConnect = async () => {
    if (!window.ethereum) {
      setSnackbar({
        open: true,
        message: 'MetaMask not detected! Please install MetaMask to interact with Sepolia.',
        severity: 'error',
      });
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
      const hexId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(BigInt(hexId));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to connect MetaMask.',
        severity: 'error',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch Network to Sepolia
  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
      });
    } catch (switchError) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_HEX_CHAIN_ID,
                chainName: 'Ethereum Sepolia Testnet',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia-rpc.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  };

  // Safe Token Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');

    if (!account) {
      setTransferError('Please connect your MetaMask wallet first.');
      return;
    }

    if (!isSepolia) {
      setTransferError('Please switch MetaMask to Ethereum Sepolia network.');
      return;
    }

    if (!recipient || !ethers.isAddress(recipient)) {
      setTransferError('Invalid recipient address. Please enter a valid 0x Ethereum address.');
      return;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setTransferError('Amount must be greater than 0.');
      return;
    }

    let parsedAmount;
    try {
      parsedAmount = ethers.parseUnits(amount, tokenInfo.decimals);
    } catch (err) {
      setTransferError('Invalid amount precision for token decimals.');
      return;
    }

    if (parsedAmount > tokenInfo.rawBalance) {
      setTransferError(`Insufficient ${tokenInfo.symbol} balance. You have ${tokenInfo.userBalance} ${tokenInfo.symbol}.`);
      return;
    }

    setIsTransferring(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      setSnackbar({
        open: true,
        message: 'Transaction sent to MetaMask. Please confirm in your wallet...',
        severity: 'info',
      });

      const tx = await contract.transfer(recipient, parsedAmount);

      setSnackbar({
        open: true,
        message: `Transaction broadcast! Waiting for confirmation on Sepolia...`,
        severity: 'info',
        txHash: tx.hash,
      });

      // Wait for 1 confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSnackbar({
          open: true,
          message: `Successfully transferred ${amount} ${tokenInfo.symbol}!`,
          severity: 'success',
          txHash: tx.hash,
        });

        // Record recent transaction
        setTransactions(prev => [
          {
            hash: tx.hash,
            recipient,
            amount,
            symbol: tokenInfo.symbol,
            timestamp: new Date().toLocaleTimeString(),
            label: recipient.toLowerCase() === LECTURER_ADDRESS.toLowerCase() ? 'Lecturer Transfer' : 'Transfer',
          },
          ...prev,
        ]);

        // Reset form and reload balance
        setAmount('');
        loadTokenData();
      } else {
        throw new Error('Transaction execution failed on-chain.');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      let msg = err.reason || err.message || 'Transaction failed';
      if (err.code === 'ACTION_REJECTED' || (err.info && err.info.error && err.info.error.code === 4001)) {
        msg = 'Transaction rejected by user in MetaMask.';
      }
      setTransferError(msg);
      setSnackbar({
        open: true,
        message: msg,
        severity: 'error',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: `${label} copied to clipboard!`,
      severity: 'success',
    });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {/* Top Navigation Bar */}
      <AppBar position="static" elevation={2} sx={{ background: '#0e1726', borderBottom: '1px solid #1e293b' }}>
        <Toolbar>
          <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
            <span style={{ fontSize: '24px' }}>🪙</span>
            <div>
              <Typography variant="h6" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Gold13 <span style={{ color: '#38bdf8' }}>Dashboard</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: -0.5 }}>
                Ethereum Sepolia Testnet · ERC-20
              </Typography>
            </div>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            {/* Network Chip */}
            {account && (
              <Chip
                icon={<span className="material-icons" style={{ fontSize: '16px' }}>{isSepolia ? 'check_circle' : 'warning'}</span>}
                label={isSepolia ? 'Sepolia (11155111)' : 'Wrong Network'}
                color={isSepolia ? 'success' : 'error'}
                size="small"
                variant="outlined"
                onClick={!isSepolia ? handleSwitchNetwork : undefined}
                sx={{ cursor: !isSepolia ? 'pointer' : 'default', fontWeight: 600 }}
              />
            )}

            {/* Wallet Button */}
            {account ? (
              <Chip
                avatar={<span className="material-icons" style={{ color: '#38bdf8' }}>account_balance_wallet</span>}
                label={`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                variant="filled"
                color="primary"
                onClick={() => copyToClipboard(account, 'Wallet address')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<span className="material-icons">account_balance_wallet</span>}
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? <CircularProgress size={20} color="inherit" /> : 'Connect MetaMask'}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Container */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6, flexGrow: 1 }}>
        
        {/* Network Warning Banner */}
        {account && !isSepolia && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" variant="outlined" onClick={handleSwitchNetwork}>
                Switch to Sepolia
              </Button>
            }
          >
            <AlertTitle>Wrong Network Detected</AlertTitle>
            Your MetaMask is connected to another network. Please switch to <strong>Ethereum Sepolia (Chain ID 11155111)</strong> to interact with this token.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Token & Account Overview */}
          <Grid item xs={12} md={5}>
            <Box display="flex" flexDirection="column" gap={3}>
              
              {/* Token Info Card */}
              <Card>
                <CardHeader
                  avatar={<span className="material-icons" style={{ color: '#f59e0b' }}>toll</span>}
                  title={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{tokenInfo.name} ({tokenInfo.symbol})</Typography>
                      {loadingToken && <CircularProgress size={16} />}
                    </Box>
                  }
                  subheader="Verified ERC-20 Token Specification"
                />
                <Divider sx={{ borderColor: '#1e293b' }} />
                <CardContent>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <div>
                      <Typography variant="caption" color="text.secondary">Contract Address</Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: '#090d16', p: 1, borderRadius: 1, flexGrow: 1, border: '1px solid #1e293b' }}>
                          {tokenAddress}
                        </Typography>
                        <Tooltip title="Copy address">
                          <IconButton size="small" onClick={() => copyToClipboard(tokenAddress, 'Contract address')}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>content_copy</span>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View on Etherscan">
                          <IconButton size="small" component="a" href={`https://sepolia.etherscan.io/address/${tokenAddress}`} target="_blank">
                            <span className="material-icons" style={{ fontSize: '18px' }}>open_in_new</span>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </div>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#0b111e', borderColor: '#1e293b' }}>
                          <Typography variant="caption" color="text.secondary">Decimals</Typography>
                          <Typography variant="body1" fontWeight={700}>{tokenInfo.decimals}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#0b111e', borderColor: '#1e293b' }}>
                          <Typography variant="caption" color="text.secondary">Total Supply</Typography>
                          <Typography variant="body1" fontWeight={700}>{Number(tokenInfo.totalSupply).toLocaleString()} {tokenInfo.symbol}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>

              {/* Wallet Balances Card */}
              <Card>
                <CardHeader
                  avatar={<span className="material-icons" style={{ color: '#38bdf8' }}>account_balance</span>}
                  action={
                    <IconButton onClick={loadTokenData} title="Refresh Balances">
                      <span className="material-icons" style={{ fontSize: '20px' }}>refresh</span>
                    </IconButton>
                  }
                  title="Your Wallet Balances"
                  subheader={account ? `${account.substring(0, 10)}...${account.substring(account.length - 8)}` : 'Wallet not connected'}
                />
                <Divider sx={{ borderColor: '#1e293b' }} />
                <CardContent>
                  {account ? (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#0b111e', borderColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Typography variant="caption" color="text.secondary">{tokenInfo.name} ({tokenInfo.symbol})</Typography>
                          <Typography variant="h5" color="primary.main" fontWeight={800}>
                            {parseFloat(tokenInfo.userBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                          </Typography>
                        </div>
                        <Chip label={tokenInfo.symbol} color="primary" size="small" sx={{ fontWeight: 700 }} />
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#0b111e', borderColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Typography variant="caption" color="text.secondary">Sepolia Gas (ETH)</Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {parseFloat(ethBalance).toFixed(4)} ETH
                          </Typography>
                        </div>
                        <Chip label="Gas Token" variant="outlined" size="small" />
                      </Paper>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Connect your MetaMask wallet to view your live balances.
                      </Typography>
                      <Button variant="outlined" color="primary" onClick={handleConnect} sx={{ mt: 1 }}>
                        Connect Wallet
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Mandatory Lecturer Handoff Status */}
              <Card sx={{ border: '1px solid #164e63', background: 'linear-gradient(135deg, #082f49 0%, #0f172a 100%)' }}>
                <CardHeader
                  avatar={<span className="material-icons" style={{ color: '#38bdf8' }}>school</span>}
                  title="Professor's Task Verification"
                  subheader="Sent 1.0 whole token to lecturer address"
                />
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Sepolia lecturer wallet:
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all', bgcolor: 'rgba(0,0,0,0.3)', p: 1, borderRadius: 1, mb: 1.5 }}>
                    {LECTURER_ADDRESS}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      component="a"
                      href={`https://sepolia.etherscan.io/tx/${INITIAL_PROOF_TX}`}
                      target="_blank"
                      startIcon={<span className="material-icons" style={{ fontSize: '16px' }}>verified</span>}
                    >
                      View Proof on Etherscan
                    </Button>
                  </Box>
                </CardContent>
              </Card>

            </Box>
          </Grid>

          {/* Right Column: Transfer Form & Transaction History */}
          <Grid item xs={12} md={7}>
            <Box display="flex" flexDirection="column" gap={3}>
              
              {/* Transfer Token Card */}
              <Card>
                <CardHeader
                  avatar={<span className="material-icons" style={{ color: '#38bdf8' }}>send</span>}
                  title="Transfer ERC-20 Tokens"
                  subheader={`Send ${tokenInfo.symbol} safely with on-chain validation`}
                />
                <Divider sx={{ borderColor: '#1e293b' }} />
                <CardContent>
                  <form onSubmit={handleTransfer}>
                    <Box display="flex" flexDirection="column" gap={2.5}>
                      
                      {/* Recipient Input */}
                      <div>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>Recipient Address</Typography>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ fontSize: '11px', py: 0 }}
                            onClick={() => setRecipient(LECTURER_ADDRESS)}
                          >
                            Fill Professor Address
                          </Button>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="0x..."
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          error={Boolean(recipient && !ethers.isAddress(recipient))}
                          helperText={recipient && !ethers.isAddress(recipient) ? 'Invalid Ethereum address format' : ''}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <span className="material-icons" style={{ fontSize: '18px', color: '#64748b' }}>wallet</span>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </div>

                      {/* Amount Input */}
                      <div>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>Amount ({tokenInfo.symbol})</Typography>
                          {account && (
                            <Typography variant="caption" color="text.secondary">
                              Available: {parseFloat(tokenInfo.userBalance).toFixed(4)} {tokenInfo.symbol}
                            </Typography>
                          )}
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          step="any"
                          placeholder="e.g. 1.0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Button
                                  size="small"
                                  onClick={() => setAmount(tokenInfo.userBalance)}
                                  sx={{ minWidth: 'auto', px: 1, py: 0.2, fontSize: '12px' }}
                                >
                                  MAX
                                </Button>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </div>

                      {/* Error Alert */}
                      {transferError && (
                        <Alert severity="error" onClose={() => setTransferError('')}>
                          {transferError}
                        </Alert>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={isTransferring || !account}
                        startIcon={isTransferring ? <CircularProgress size={20} color="inherit" /> : <span className="material-icons">send</span>}
                        sx={{ py: 1.5, mt: 1 }}
                      >
                        {isTransferring ? 'Confirming On-Chain...' : !account ? 'Connect Wallet to Transfer' : `Send ${tokenInfo.symbol}`}
                      </Button>

                    </Box>
                  </form>
                </CardContent>
              </Card>

              {/* Transaction Activity Card */}
              <Card>
                <CardHeader
                  avatar={<span className="material-icons" style={{ color: '#38bdf8' }}>history</span>}
                  title="Recent Activity & Evidence"
                  subheader="Live transaction confirmations on Ethereum Sepolia"
                />
                <Divider sx={{ borderColor: '#1e293b' }} />
                <CardContent sx={{ p: 0 }}>
                  <List disablePadding>
                    {transactions.map((tx, idx) => (
                      <React.Fragment key={tx.hash}>
                        <ListItem
                          sx={{
                            py: 2,
                            px: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <span className="material-icons" style={{ color: '#10b981' }}>check_circle</span>
                            <div>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight={700}>
                                  {tx.label || 'Token Transfer'}
                                </Typography>
                                <Chip label={`-${tx.amount} ${tx.symbol}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                To: {tx.recipient.substring(0, 8)}...{tx.recipient.substring(tx.recipient.length - 6)}
                              </Typography>
                            </div>
                          </Box>

                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary">
                              {tx.timestamp}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              component="a"
                              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              endIcon={<span className="material-icons" style={{ fontSize: '14px' }}>open_in_new</span>}
                              sx={{ fontSize: '11px', py: 0.2 }}
                            >
                              Etherscan
                            </Button>
                          </Box>
                        </ListItem>
                        {idx < transactions.length - 1 && <Divider sx={{ borderColor: '#1e293b' }} />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>

            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', borderTop: '1px solid #1e293b', bgcolor: '#090d16', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Gold13 (MTK) · Sepolia Testnet (Chain ID 11155111) · GitHub:{' '}
          <Link href="https://github.com/ho1yspirt" target="_blank" color="primary" underline="hover">
            ho1yspirt
          </Link>
        </Typography>
      </Box>

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            snackbar.txHash ? (
              <Button
                color="inherit"
                size="small"
                component="a"
                href={`https://sepolia.etherscan.io/tx/${snackbar.txHash}`}
                target="_blank"
              >
                View
              </Button>
            ) : null
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

// Render React App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
