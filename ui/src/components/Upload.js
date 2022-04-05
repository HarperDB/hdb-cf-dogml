import { Input } from 'reactstrap';
import React from 'react';

function Upload({ setImageObject }) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageName = file.name;
      const reader = new FileReader();
      reader.onload = (value) => {
        const binary = value.target.result;
        const imageData = btoa(binary);
        setImageObject({ imageName, imageData });
      }
      reader.readAsBinaryString(file);
    }
  }
  return (
    <Input
      id="exampleFile"
      name="file"
      type="file"
      className="mb-3"
      onChange={handleChange}
    />
  );
}

export default Upload;
