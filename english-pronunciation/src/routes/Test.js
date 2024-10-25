import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
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
    let [results, setResults] = useState([])
    let [isResult, setIsResult] = useState(false)
    let [score, setScore] = useState(0)
    let [len, setLen] = useState(0)
    let [recog, setRecog] = useState('')
    let [end, setEnd] = useState(false)
    let [nums, setNums] = useState([])

    let navigate = useNavigate()

    const getWords = async () => {
        const res = await axios.get('/words', {withCredentials : true})
        const arr = res.data.words
        setNums(res.data.nums)
        let temp = []
        for (let i = 0; i < arr.length; i++){
            temp.push(arr[i].word)
        }
        setWords(temp)
        setLen(temp.length)
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

        try {
            const res = await axios.post('/test', formData, {
                headers : {
                    "Content-Type" : "multipart/form-data"
                }
            })
    
            setIsResult(true)
            setScore(res.data.score)
            setRecog(res.data.recognized)
        } catch (error) {
            console.log(error)
        }
        
    }

    const submit = async () => {
        await axios.post('/result', {scores : results, nums: nums}, {withCredentials : true})
          .then(response => {
            if (response.status == 200) {
                window.location.href = '/'
            }
          })
          .catch(error => {
            alert(error)
          })
    }
    
    return(
        <div className='test mt-5'>
            {end ? 
            <Button variant="success" onClick={() => {submit()}}>제출</Button> 
            :
            <div>
                <p>문제 {count + 1} / {len}</p>
                <p>{word}</p>
                <Button variant="success" onClick={recording ? stopRecording : StartRecording}>
                    {recording ? "정지" : "녹음"}
                </Button>
                {audioURL && (
                    <div className='mt-3'>
                        <p>녹음 결과</p>
                        <audio controls src={audioURL}></audio>
                        <br />
                        {!isResult && <Button variant="success" onClick={() => {handleSubmit()}} className='mt-2'>제출</Button>}
                        {isResult && <p className='mt-2'>점수: {score} <br /> AI가 인식한 발음: {recog}</p>}
                    </div>
                )}
                <br />
                {isResult && (
                <Button variant="success" onClick={() => {
                    let copy = [...results, score]
                    setResults(copy)
                    setAudioURL(null)
                    setIsResult(false)
                    if (count == words.length - 1){
                        setEnd(true)
                    } else {
                        let t = count
                        setCount(count + 1)
                        setWord(words[t + 1])
                    }
                }} className='mt-3'>다음</Button>)}
            </div>
            }
        </div>
    )
}

export default Test;