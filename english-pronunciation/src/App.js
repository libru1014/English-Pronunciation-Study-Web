import logo from './logo.svg';
import './App.css';
import {Button, Nav, Navbar, Container} from 'react-bootstrap'

function App() {
  return (
    <div className="App">
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="/">영어 발음 테스트</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Item>
                <Nav.Link href="/statistic">통계</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link href="/mypage" className="transparent">마이페이지</Nav.Link>
              </Nav.Item>
            </Nav>
            <Nav className="ml-auto">
              <Nav.Item>
                <Nav.Link href="/login">로그인</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link href="/register">회원가입</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Button className="transparent">로그아웃</Button>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}

export default App;
