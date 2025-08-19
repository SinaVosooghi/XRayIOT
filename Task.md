PANTOhealth Backend Developer Technical Assessment
Subtitle: IoT Data Management System with RabbitMQ Integration
Project Overview:
Develop a NestJS application that processes x-ray data from IoT devices using
RabbitMQ, stores processed information, and provides API endpoints for data retrieval
and analysis.
Sample x-ray data is available through link below:
Sample data:
https:/ /drive.google.com/file/d/1NTxLA_5OYx2kSnPlXkwQ2AzcLBxRlkTr/view?usp=sha
ring
Sample data description:
{
"66bb584d4ae73e488c30a072": { //deviceId
"data": [
[
762, //time
[
51.339764, // x-coordination
12.339223833333334, //y-coordination
1.2038000000000002 //speed
]
],
[
1766,
[
51.33977733333333,
12.339211833333334,
1.531604
]
],
[
2763,
[
51.339782,
12.339196166666667,
2.13906
]
],
],
"time": 1735683480000 //timestamp
}
}
Part 1: RabbitMQ Module in NestJS Project
For the first part of the assignment, the developer should create a NestJS project with a
RabbitMQ module. Here's what this part should include:
1. 2. Set up a new NestJS project using the Nest CLI.
Create a RabbitMQ module that:
●
Establishes a connection to RabbitMQ
●
Asserts the required queues, including the x-ray queue
●
Implements a consumer for the x-ray data
Part 2: Data Processing and Collections
In this part, the developer should create a signals collection and process the incoming
x-ray data. Here's a detailed breakdown of what this part should include:
1. Create an x-ray schema and model:
●
Define a Mongoose schema for the x-ray collection
●
Include fields: deviceId, time, dataLength(length of data array),
dataVolume(Size of x-ray data), and any other relevant x-ray data
parameters
2. Implement a SignalService:
●
Create methods to save new signals to the database
●
Implement data processing logic to extract required parameters from x-ray
data
3. Process incoming x-ray data:
●
In the RabbitMQ consumer, parse the incoming x-ray data
●
Extract the deviceId and timestamp
●
Calculate the data length
4. Store processed data:
●
Create a new x-ray document for each processed x-ray message
●
Save the document to the signals collection
5. Error handling:
●
Implement proper error handling for data processing and database
operations (bonus points,Optional)
Part 3: API Development
Description: Create RESTful API endpoints to interact with the stored data.
Tasks:
●
●
Implement CRUD operations for Signals
Create one optional endpoint for data retrieval with filtering
Part 4: Producer Application
Description: Develop a simple application to simulate IoT devices sending x-ray data.
Tasks:
●
●
Create a separate NestJS application or module
Implement a RabbitMQ producer to send sample x-ray data
Part 5: Testing and Documentation
Description: Ensure code quality and provide clear documentation.
Tasks:
●
●
●
Write unit tests for key components
Provide clear API documentation (e.g., using Swagger) (bonus points,Optional)
Include a README with setup and running instructions (bonus points,Optional)
Submission Guidelines:
●
●
●
Provide a GitHub repository with your solution
Include a README with setup instructions and any assumptions made(bonus
points,Optional)
Dockerize each project (bonus points,Optional)