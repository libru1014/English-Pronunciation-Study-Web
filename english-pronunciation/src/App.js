import logo from './logo.svg';
import './App.css';
import {Button, Nav, Navbar, Container} from 'react-bootstrap';
import {Routes, Route, Link, useNavigate} from 'react-router-dom';
import {lazy, Suspense, useEffect, useState} from 'react';
import axios from 'axios';

const Login = lazy(() => import('./routes/Login.js'))
const Register = lazy(() => import('./routes/Register.js'))
const Test = lazy(() => import('./routes/Test.js'))

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUserName] = useState('')
  
  let navigate = useNavigate();

  const isUser = async () => {
    try {
      const res = await axios.get('http://localhost:8080/check-auth', {withCredentials : true})
      if (res.data.loggedIn) {
        console.log('User is logged in: ', res.data.user)
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
                <Nav.Link onClick={() => {navigate('/test')}}>테스트</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link onClick={() => {navigate('/statistic')}}>통계</Nav.Link>
              </Nav.Item>
              {loggedIn && 
              <Nav.Item>
                <Nav.Link onClick={() => {navigate('/mypage')}}>마이페이지</Nav.Link>
              </Nav.Item>}
            </Nav>
            <Nav className="ml-auto">
              {loggedIn ? 
              <Nav.Item>
                <Button onClick={() => {
                  const res = axios.get('http://localhost:8080/logout', {withCredentials : true})
                }}>로그아웃</Button>
              </Nav.Item>
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
      </Routes>
    </div>
  );
}

export default App;
