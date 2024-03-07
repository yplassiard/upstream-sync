# Answers to questions on the given Tasks
## Task 2

> 1. To include messages already stored in the database, which existing repository method should be leveraged?
I would leverage the **findAll** method of the ThreadRepository class.

> 2. Describe how you would use this method to achieve the intended outcome. Implementation details are not required, just a clear explanation of your approach.

By calling this *findAll* method, I'd be able to currently handled emails againsts already created threads and therefore, assign them to the right thread respectively if such a thread exist, or create a new one otherwise.

### Task 3: Display the domain name of the sender

> In the `MessageDisplayService`, how would you display the domain name of the sender's email address for each email? Think about the best way to **_encapsulate_** the logic for extracting the domain name and **where** it should be placed in the codebase.

I would add a **domain** property within the **EmailDddress** value-object. To extract this domain name part, I would use a regular expression like this one:
```
/^[^@]+@([^@]+)$/
```
To ease code readability however, I would remove the **isValueValid** method and replace it with a **extractDomain** one, that would throw an "invalid value" error if the regular expression is not satisfied.

### Task 4: Preventing Duplicate Imports in Parallel Email Processing

> Consider a scenario where emails of different users are imported daily through parallel execution processes. When multiple users interact with the service, it's possible for the service to import emails having the same `Message-Id` (for example, when user A sends an email to users B and C, both B and C will have emails in their inboxes with the same `Message-Id`).

> Given that import processes are executed in parallel, there's a risk that emails corresponding to a specific `Message-Id` might be imported multiple times. Explain how you would ensure that only a single instance of an email is imported for each unique `Message-Id`? Your response may involve infrastructure or architectural changes if needed, but this is not required. Do not implement the solution, just describe the approach you would take.
Based on this `Message-Id` assumption, a first approach would be to use some database logic to handle such cases. For example with PostgreSQL:
```
INSERT INTO `emails` ... ON CONFLICT (universal_message_id) DO NOTHING;
```

Because emails are imported on a daily basis, and although an `INSERT ... ON CONFLICT` (or `INSERT IF NOT EXIST`) statements are slower than regular `INSERT` statements, this solutiton has the advantage to guarantee that data will be inserted only once, even if the PostgreSQL server is part of a multi-node database with several replicas, or behind a load-balancer.



### Task 5: Testing

> What do you believe is the most effective strategy for testing this project? What is your philosophy regarding testing?

I would test this project using the following strategy:
1. **unit test**: all value-objects should be tested, to ensure they behave appropriately (checking that an **EmailAddress** would raise an error if an invalid value is given for example).
2. unit-test with **mocking**: Testing all entities mocking the underlying database so that we're sure that the returned values are valid and that the underlying **Entity** objects are constructed appropriately.
3. **service unit-tests**: Each service should be unit-tested as well, using the mocks from the database defined above, and providing pre-generated inputs to handle different cases: (invalid / no data, expected valid data, as well as very big data chunks to estimate how the given service behaves while loaded).
4. **loading tests**: Given a fully configured instance (this project + underlying DB), feed this application with different scenarios. Before starting such tests, it may be a good idea to add some checkpoinss within the codebase to be able to measure precisely how much time is taken within several parts of the execution. For example:
- time spent retrieving incoming emails from the network.
- time spent generating internal email parsing / model generating.
- time spent executing SQL queries
- amount of executed SQL queries for a single batch.

All of this metrics could be printed to **syslog** and then ingested within an Elasticsearch instance, to be viewed / analyzed later on using Kibana for example.
In the below scenarios, numbers are example numbers. They depends on machine's configuration, network / bandwijdth speed, DNS responsiveness, etc.
- normal behavior: from 50 to 100 messages per minute, run the server for 5 minutes and ensure that all messages are ingested correctly and without too much delay.
- heavy load: same test but with 100 - 200 messages per minutes.
- infinite load: retrieve 5000 messages per minute and monitor the server's behavior.

## Feedback

Your insights and feedback on the project and the process are invaluable. Please share your thoughts after you have completed the assignment.
