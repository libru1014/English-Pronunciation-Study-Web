import Table from 'react-bootstrap/Table';
import axios from 'axios';
import { useEffect, useState } from 'react';

function Statistic(){
    const [a, setA] = useState(null)
    const [e, setE] = useState(null)
    const [i, setI] = useState(null)
    const [o, setO] = useState(null)
    const [u, setU] = useState(null)
    const [s, setS] = useState(null)
    const [d, setD] = useState(null)
    const [cycle, setCycle] = useState(null)

    const getStatistic = async () => {
        try {
            const res = await axios.get('/statistics', {withCredentials : true})
            setA(res.data.a)
            setE(res.data.e)
            setI(res.data.i)
            setO(res.data.o)
            setU(res.data.u)
            setS(res.data.single_con)
            setD(res.data.double_con)
            setCycle(res.data.cycle)
        } catch (error) {
            console.log('Error: ', error)
        }
    }

    useEffect(() => {
        getStatistic()
    }, [])
    
    return(
        <div>
            <div className='ex mt-3'>
                <h5 className='mt-3'>a, e, i, o, u의 경우, 각각의 모음의 발음이 어려운 유형을 의미합니다.</h5>
                <h5>single consonant는 단일 자음, double consonant는 이중 자음의 발음이 어려운 유형을 의미합니다.</h5>
                <h6 className='mb-3'>발음의 점수가 4점 이상인 경우에는 -1, 4점 미만 2.5점 이상은 0, 2.5점 미만은 +1을 점수에 추가합니다. <br />
                점수가 -10점 미만일 경우 해당 유형의 문제 수가 하나 줄어드며 10점 초과일 경우 해당 유형의 문제 수가 하나 늘어납니다. <br />
                &#40;모음의 기본 문제 수: 각각 2문제, 자음의 기본 문제 수: 각각 3문제&#41;</h6>
                <h6>현재 푼 문제 cycle: {cycle}</h6>
            </div>
            <Table striped bordered hover className='tables mt-3'>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>a</td>
                        <td>{a}</td>
                    </tr>
                    <tr>
                        <td>e</td>
                        <td>{e}</td>
                    </tr>
                    <tr>
                        <td>i</td>
                        <td>{i}</td>
                    </tr>
                    <tr>
                        <td>o</td>
                        <td>{o}</td>
                    </tr>
                    <tr>
                        <td>u</td>
                        <td>{u}</td>
                    </tr>
                    <tr>
                        <td>single consonant</td>
                        <td>{s}</td>
                    </tr>
                    <tr>
                        <td>double consonant</td>
                        <td>{d}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    )
}

export default Statistic;