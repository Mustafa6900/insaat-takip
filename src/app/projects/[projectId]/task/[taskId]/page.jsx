'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { db, storage } from '../../../../firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

const TaskDetails = ({ params }) => {
  const { projectId, taskId } = params;
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (taskId) {
      const fetchFiles = async () => {
        const filesCollection = collection(db, 'files');
        const q = query(filesCollection, where('taskId', '==', taskId));
        const filesSnapshot = await getDocs(q);
        const filesList = filesSnapshot.docs.map(doc => doc.data());
        setFiles(filesList);
      };
      fetchFiles();
    }
  }, [taskId]);

  const handleFileUpload = () => {
    if (selectedFile) {
      const storageRef = ref(storage, `files/${selectedFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Handle progress
        },
        (error) => {
          console.error('Error uploading file:', error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            addDoc(collection(db, 'files'), {
              taskId,
              url: downloadURL,
              name: selectedFile.name,
            });
            alert('File uploaded successfully!');
          });
        }
      );
    }
  };

  return (
    <div>
      <h1>Task Details</h1>
      <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
      <button onClick={handleFileUpload}>Upload File</button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskDetails;
