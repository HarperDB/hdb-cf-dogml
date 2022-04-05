import React, {useState} from 'react';
import { Navbar, NavbarBrand, Row, Col, Card, CardBody, Button } from 'reactstrap';
import useAsyncEffect from 'use-async-effect';

import Upload from './Upload';

const postData = async ({ imageObject }) => {
  console.log(imageObject); // eslint-disable-line no-console
  const response = await fetch('/dogml/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imageObject)
  });
  return response.json();
}

function App() {
  const [imageObject, setImageObject] = useState(false);
  const [classification, setClassification] = useState(false);

  useAsyncEffect(async () => {
    if (imageObject) {
      const classificationResult = await postData({ imageObject });
      setClassification(classificationResult);
    }
  }, [imageObject]);

  const reset = () => {
    setImageObject(false);
    setClassification(false);
  }

  return (
    <>
      <div id="app">
        <Navbar id="app-nav" dark fixed="top" expand="xs">
          <NavbarBrand>
            <div id="logo" title="Go to Organizations Home" />
          </NavbarBrand>
          <h5 className="text-white">
            ML Dog : TensorflowJS & Custom Functions
          </h5>
        </Navbar>
        <div id="app-container">
          <Row>
            <Col lg={6}>
              <Card>
                <CardBody>
                  <h6>Image upload</h6>
                  <hr className="mt-2 mb-3" />
                  {classification ? (
                    <>
                      <Button block color="success" className="mb-3" onClick={reset}>Reset Image</Button>
                      <img alt="uploaded" width="100%" src={classification.image_url} />
                    </>
                  ) : (
                    <>
                      <Upload setImageObject={setImageObject} />
                      {imageObject && (<img alt="uploaded" width="100%" src={`data:image/jpg;base64,${imageObject.imageData}`} />)}
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg={6}>
              <Card>
                <CardBody>
                  <h6>Classification results</h6>
                  <hr className="mt-2 mb-3" />
                  {classification ? (
                    <>
                      <Row>
                        <Col lg={4} className="text-bold">image</Col>
                        <Col>{classification.image_name}</Col>
                      </Row>
                      <hr className="m-3" />
                      <Row>
                        <Col lg={4} className="text-bold">breed</Col>
                        <Col>{classification.breed}</Col>
                      </Row>
                      <hr className="m-3" />
                      <Row>
                        <Col lg={4} className="text-bold">confidence</Col>
                        <Col>{classification.confidence}</Col>
                      </Row>
                      <hr className="m-3" />
                      <Row>
                        <Col lg={4} className="text-bold">elapsed time</Col>
                        <Col>{classification.time_to_classify}ms</Col>
                      </Row>
                      <hr className="m-3" />
                      <Row>
                        <Col lg={4} className="text-bold">model name</Col>
                        <Col>{classification.model_name}</Col>
                      </Row>
                      <hr className="m-3" />
                    </>
                  ) : (
                    <div className="text-center py-3">Please upload a jpg of a dog using the form at left</div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
      <div id="app-bg-color" />
      <div id="app-bg-dots" />
    </>
  );
}

export default App;
