import './App.css';
import {Button, Nav, Navbar, Container} from 'react-bootstrap';
import {Routes, Route, useNavigate} from 'react-router-dom';
import {lazy, Suspense, useEffect, useState} from 'react';
import axios from 'axios';

const Login = lazy(() => import('./routes/Login.js'))
const Register = lazy(() => import('./routes/Register.js'))
const Test = lazy(() => import('./routes/Test.js'))
const Statistic = lazy(() => import('./routes/Statistic.js'))

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUserName] = useState('')
  
  let navigate = useNavigate();

  const isUser = async () => {
    try {
      const res = await axios.get('/check-auth', {withCredentials : true})
      if (res.data.loggedIn) {
        setLoggedIn(true)
        setUserName(res.data.user.username)
      } else {
        setLoggedIn(false)
        setUserName('')
      }
    } catch (error) {
      console.log('Error: ', error)
    }
  }
  
  useEffect(() => {
    isUser()
  }, [])

  return (
    <div className="App">
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand onClick={() => {navigate('/')}}>영어 발음 테스트</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item>
                <Nav.Link onClick={() => {
                  loggedIn ? 
                  navigate('/test')
                  :
                  alert("로그인이 필요한 서비스입니다.")
                }}>테스트</Nav.Link>
              </Nav.Item>
              {loggedIn && 
              <Nav.Item>
                <Nav.Link onClick={() => {navigate('/statistic')}}>통계</Nav.Link>
              </Nav.Item>}
            </Nav>
            <Nav className="ml-auto">
              {loggedIn ? 
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <Nav.Item className='me-3 mt-1'>
                  {username + '님, 환영합니다.'}
                </Nav.Item>
                <Nav.Item>
                  <Button onClick={async () => {
                    await axios.get('/logout', {withCredentials : true})
                      .then(response => {
                        if (response.status == 200) {
                          window.location.href = '/'
                        }
                      })
                      .catch(error => {
                        alert(error)
                      })
                  }}>로그아웃</Button>
                </Nav.Item>
              </div>
              :
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <Nav.Item>
                  <Nav.Link onClick={() => {navigate('/login')}}>로그인</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => {navigate('/register')}}>회원가입</Nav.Link>
                </Nav.Item>
              </div>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path='/' element={
          <>
            <div>
              영어 발음 테스트입니다.
            </div>
          </>
        } />
        <Route path='/test' element={
          <Suspense fallback={<div>로딩중임</div>}>
            <Test />
          </Suspense>
        }/>
        <Route path='/login' element={
          <Suspense fallback={<div>로딩중임</div>}>
            <Login />
          </Suspense>
        }/>
        <Route path='/register' element={
          <Suspense fallback={<div>로딩중임</div>}>
            <Register />
          </Suspense>
        }/>
        <Route path='/statistic' element={
          <Suspense fallback={<div>로딩중임</div>}>
            <Statistic />
          </Suspense>
        }/>
      </Routes>
    </div>
  );
}

export default App;
