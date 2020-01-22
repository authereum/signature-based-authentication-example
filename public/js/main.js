const loginButton = document.getElementById('login')
const logoutButton = document.getElementById('logout')
const verifyButton = document.getElementById('verify')
const output = document.getElementById('output')

const authereum = new Authereum('kovan')
const provider = authereum.getProvider()
const web3 = new Web3(provider)

loginButton.addEventListener('click', async (event) => {
  event.preventDefault()

  await login()
  await signChallenge()
})

logoutButton.addEventListener('click', async (event) => {
  event.preventDefault()

  await logout()
})

verifyButton.addEventListener('click', async (event) => {
  event.preventDefault()

  const res = await verifyToken()
  log(res)
})

;(() => {
  loginCheck()
})();

async function login() {
  if (!await authereum.isAuthenticated()) {
    await authereum.login()
  }

  await loginCheck()
}

async function loginCheck() {
  const loggedIn = await authereum.isAuthenticated()
  log({loggedIn})

  loginButton.style.display = loggedIn ? 'none' : 'inline-block'
  logoutButton.style.display = loggedIn ? 'inline-block' : 'none'
  verifyButton.style.display =  loggedIn ? 'inline-block' : 'none'
}

async function logout() {
  await authereum.logout()
  await loginCheck()
}

async function signChallenge() {
  const res = await fetch('/challenge')
  const json = await res.json()

  const message = json.challenge
  const address = (await web3.eth.getAccounts())[0]
  const signature = await web3.eth.sign(message, address)

  // NOTE: this secret doesn't matter if it's exposed because
  // the server does authentication by verifying
  // the signature from the auth key.
  const TOKEN_SECRET = 'somesecret'
  const TOKEN_ALGORITHM = 'HS256'

  const token = jwt.sign({ address, signature }, TOKEN_SECRET, {
    algorithm: TOKEN_ALGORITHM
  })

  localStorage.setItem('token', token)
}

async function verifyToken() {
  const token = localStorage.getItem('token')
  if (!token) {
    return {error: 'token not set'}
  }

  const res = await fetch('/verify', {
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  const json = await res.json()
  return json
}

function log(content) {
  if (typeof content === 'object') {
    content = JSON.stringify(content, null, 2)
  }
  output.textContent = content
}
