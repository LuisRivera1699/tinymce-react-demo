import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, addDoc, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZySq7l0J4Dodn5g7gMfV4QsdMQ-Lg_mw",
  authDomain: "rte-firebase.firebaseapp.com",
  projectId: "rte-firebase",
  storageBucket: "rte-firebase.firebasestorage.app",
  messagingSenderId: "817983635524",
  appId: "1:817983635524:web:50dcb6da7b36c3c8d8fc11"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [labId, setLabId] = useState("");
  const editorRef = useRef(null);
  const [exists, setExists] = useState(false);
  const [docu, setDocu] = useState();
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (e) => {
    setLabId(e.target.value);
  }

  const checkDocument = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lab-instructions'), where('labId', '==', labId));
      const querySnapshot = await getDocs(q);
      setExists(!querySnapshot.empty);
      if (querySnapshot.empty) {
        setExists(false);
        setDocu(null);
        editorRef.current.setContent("");
      } else {
        setExists(true);
        setDocu(querySnapshot.docs[0]);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (labId) {
      checkDocument();
    } else {
      setExists(false);
      setDocu(null);
    }
  }, [labId]);

  useEffect(() => {
    if (editorRef.current) {
      if (docu && docu.data().instructions) {
        editorRef.current.setContent(docu.data().instructions)
      } else {
        editorRef.current.setContent("");
      }
    }
  }, [docu])

  const handleUpload = async () => {
    setLoading(true);
    try {
      if (exists) {
        const docRef = doc(db, 'lab-instructions', docu.id);
        await updateDoc(docRef, {instructions: editorRef.current.getContent()});
      } else {
        await addDoc(
          collection(
            db, 'lab-instructions'
          ),
          {
            'labId': labId,
            'instructions': editorRef.current.getContent()
          }
        );
      }
      alert('Created!');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px', textAlign: 'left', fontSize: '24px' }}>
        <label>Lab ID</label>
        <select id="labSelect" value={labId} onChange={handleSelectChange}>
          <option value="">-- Please select a lab --</option>
          <option value="CSY102">CSY 102</option>
          <option value="DBST160">DBST 160</option>
          <option value="ITCC101">ITCC 101</option>
        </select>
        {labId && <p>Selected Lab ID: {labId}</p>}
        {exists && <p>Selected lab already with data, you will update it.</p>}
      </div>
      <Editor
        tinymceScriptSrc='/tinymce/tinymce.min.js'
        licenseKey='gpl'
        onInit={(_evt, editor) => editorRef.current = editor}
        initialValue='<p>This is the initial content of the editor.</p>'
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help | image',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          images_upload_url: 'https://image-uploader-nu-three.vercel.app/upload',
          images_upload_handler: async function (blobInfo, success) {
            const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
            const d = await fetch(`https://image-uploader-nu-three.vercel.app/upload?filename=${file.name}`, {
              method: 'POST',
              body: file
            }).then(
              response => {
                return response.json();
              }
            ).then(
              data => {
                console.log(data.location);
                success(data.location);
                return data.location;
              }
            ).catch(
              error => {
                alert(error.message);
              }
            )
            return d;
          },
          automatic_uploads: true
        }}
      />
      <button onClick={handleUpload}>{!exists ? "Create Instructions" : "Update Instructions"}</button>
      <p>{loading && 'LOADING, PLEASE WAIT...'}</p>
    </>
  );
}