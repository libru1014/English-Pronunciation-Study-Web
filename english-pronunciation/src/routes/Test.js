import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Test(){
    const [recording, setRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    let [count, setCount] = useState(0);
    let [words, setWords] = useState([]);
    let [word, setWord] = useState('')
    let [modal, setModal] = useState(false)
    let [results, setResults] = useState([])
    let [isResult, setIsResult] = useState(false)
    let [score, setScore] = useState(0)


    const getWords = async () => {
        const res = await axios.get('http://localhost:8080/words')
        const arr = res.data.words
        let temp = []
        for (let i = 0; i < arr.length; i++){
            temp.push(arr[i].word)
        }
        console.log(temp)
        setWords([...temp])
    }
    
    useEffect(() => {
        getWords()
    }, [])
    
    useEffect(() => {
        if (words.length > 0) {
            setWord(words[count])
        }
    }, [words, count])

    const StartRecording = () => {
        navigator.mediaDevices.getUserMedia({audio: true})
          .then((stream) => {
            const recorder = new MediaRecorder(stream)
            recorder.ondataavailable = (event) => {
                const audioData = event.data
                setAudioBlob(audioData)
                const url = URL.createObjectURL(audioData)
                setAudioURL(url)
            }
            recorder.start();
            setMediaRecorder(recorder);
            setRecording(true)
          })
          .catch((error) => {
            console.error("Error accessing microphone", error)
          })
    }

    const stopRecording = () => {
        mediaRecorder.stop()
        setRecording(false)
    }

    const handleSubmit = async () => {
        const formData = new FormData()
        formData.append('file', audioBlob, 'recording.wav')
        formData.append('word', word)

        const res = await axios.post('http://localhost:8080/test', formData, {
            headers : {
                "Content-Type" : "multipart/form-data"
            }
        })

        console.log(res.data.score)
        setIsResult(true)
        setScore(res.data.score)
    }
    
    return(
        <div>
            <p>문제 {count + 1}번</p>
            <p>{word}</p>
            <button onClick={recording ? stopRecording : StartRecording}>
                {recording ? "정지" : "녹음"}
            </button>
            {audioURL && (
                <div>
                    <p>녹음 결과</p>
                    <audio controls src={audioURL}></audio>
                    <button onClick={() => {handleSubmit()}}>제출</button>
                    {isResult && <p>{score}</p>}
                </div>
            )}
            <br />
            {count == words.length - 1 ? <button onClick={() => {setModal(true)}}>결과</button> : <button onClick={() => {
                let t = count
                setCount(count + 1)
                setWord(words[t + 1])
            }}>다음</button>}

            {modal && <Modal results={results} words={words}/>}
        </div>
    )
}

function Modal(props){
    let navigate = useNavigate()
    
    return(
        <div className="mt-3">
            {
                props.results.map(function(a, i){
                    return(
                        <p>{props.words[i]}의 점수 : {a}</p>
                    )
                })
            }
            <button onClick={() => {navigate('/')}}>메인 페이지</button>
        </div>
    )
}

export default Test;