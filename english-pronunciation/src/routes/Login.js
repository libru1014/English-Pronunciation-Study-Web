import { Form, Button } from 'react-bootstrap';
import {useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const idError = {
    'empty' : '아이디를 입력해주세요.',
    'no_id' : '입력하신 아이디가 존재하지 않습니다.'
}

const pwdError = {
    'empty' : '비밀번호를 입력해주세요.',
    'no_pwd' : '잘못된 비밀번호를 입력하셨습니다.'
}

function Login(){
    const [validated, setValidated] = useState(false)
    const [id, setId] = useState('')
    const [pwd, setPwd] = useState('')
    const [validId, setValidId] = useState(false)
    const [validPwd, setValidPwd] = useState(false)

    const [errorId, setErrorId] = useState(idError.empty)
    const [errorPwd, setErrorPwd] = useState(pwdError.empty)

    const [status, setStatus] = useState(400)
    const [isStatus, setIsStatus] = useState(false)

    const handleId = (e) => {
        setId(e.target.value)
        setValidId(false)
        setErrorId(idError.empty)
    }

    const handlePwd = (e) => {
        setPwd(e.target.value)
        setValidPwd(false)
        setErrorPwd(pwdError.empty)
    }
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        
        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            try {
                const res = await axios.post('http://localhost:8080/login', {'username' : id, 'password' : pwd}, {withCredentials : true})
                console.log(res.status)
            } catch (error) {
                console.log(error)
            }
        }

        setValidated(true);
    };
    
    return(
        <div>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <h1>로그인</h1>
                <Form.Group controlId="validationUsername">
                    <Form.Label>아이디</Form.Label>
                    <Form.Control className = {`${validId ? 'is-invalid' : ''}`}
                      onChange={handleId}
                      type="text"
                      placeholder="아이디"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                        {errorId}
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="validationPassword">
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control className = {`${validPwd ? 'is-invalid' : ''}`}
                      onChange={handlePwd}
                      type="password"
                      placeholder="비밀번호"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                        {errorPwd}
                    </Form.Control.Feedback>
                </Form.Group>
                <Button type="submit">로그인</Button>
                {isStatus ? <p>{status}</p> : null}
            </Form>
        </div>
    )
}

export default Login;