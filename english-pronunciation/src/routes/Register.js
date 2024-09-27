import { Form, Button } from 'react-bootstrap';
import {useState} from 'react';
import axios from 'axios';

const idError = {
    'empty' : '아이디를 입력해주세요.',
    'exist_id' : '입력하신 아이디가 이미 존재합니다.',
    'small_len' : '아이디는 5자 이상이어야 합니다.'
}

const pwdError = {
    'empty' : '비밀번호를 입력해주세요.',
    'small_len' : '비밀번호는 8자 이상이어야 합니다.'
}

function Register(){
    const [validated, setValidated] = useState(false)
    const [id, setId] = useState('')
    const [pwd, setPwd] = useState('')
    const [validId, setValidId] = useState(false)
    const [validPwd, setValidPwd] = useState(false)
    const [validCheck, setValidCheck] = useState(false)

    const [errorId, setErrorId] = useState(idError.empty)
    const [errorPwd, setErrorPwd] = useState(pwdError.empty)

    const handleId = (e) => {
        if (e.target.value.length > 4){
            setId(e.target.value)
            setValidId(false)
            setErrorId(idError.empty)
        } else {
            setValidId(true)
            setErrorId(idError.small_len)
        }
    }

    const handlePwd = (e) => {
        if (e.target.value.length > 7){
            setPwd(e.target.value)
            setValidPwd(false)
            setErrorPwd(pwdError.empty)
        } else {
            setValidPwd(true)
            setErrorPwd(pwdError.small_len)
        }
        
    }

    const handleCheck = (e) => {
        if (e.target.value != pwd){
            setValidCheck(true)
        } else {
            setValidCheck(false)
        }
    }
    
    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            axios.post('http://localhost:8080/register', {'username' : id, 'password' : pwd})
            .then(
                (res) => {
                    if (res.status == 0){
                        setValidId(true)
                        setErrorId(idError.exist_id)
                        alert("입력한 아이디가 이미 존재합니다.")
                    }
                }
            )
        }

        setValidated(true);
        event.preventDefault();
        event.stopPropagation();
    };
    
    return(
        <div>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <h1>회원가입</h1>
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
                <Form.Group controlId="validationPasswordCheck">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control className = {`${validCheck ? 'is-invalid' : ''}`}
                      onChange={handleCheck}
                      type="password"
                      placeholder="비밀번호 확인"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                        비밀번호와 일치하지 않습니다.
                    </Form.Control.Feedback>
                </Form.Group>
                <Button type="submit">회원가입</Button>
            </Form>
        </div>
    )
}

export default Register;