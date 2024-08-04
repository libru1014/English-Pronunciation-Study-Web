import { Form, Button } from 'react-bootstrap';
import {useState} from 'react';

function Login(){
    const [validated, setValidated] = useState(false);

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
        }

        setValidated(true);
    };
    
    return(
        <div>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <h1>로그인</h1>
                <Form.Group controlId="validationUsername">
                    <Form.Label>아이디</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="아이디"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                        아이디를 입력해주세요.
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="validationPassword">
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="비밀번호"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                        비밀번호를 입력해주세요.
                    </Form.Control.Feedback>
                </Form.Group>
                <Button type="submit">로그인</Button>
            </Form>
        </div>
    )
}

export default Login;