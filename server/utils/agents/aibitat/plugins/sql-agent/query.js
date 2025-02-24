module.exports.SqlAgentQuery = {
  name: "sql-query",
  plugin: function () {
    const {
      getDBClient,
      listSQLConnections,
    } = require("./SQLConnectors/index.js");

    return {
      name: "sql-query",
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          description:
            "Run SQL queries on a `database_id` to perform SELECT, INSERT, or UPDATE operations. For SELECT queries, there should be a reasonable LIMIT on the return quantity to prevent long-running queries or queries which crash the db. INSERT and UPDATE operations should include all necessary fields and data types as specified in the table schema.",
          examples: [
            {
              prompt: "How many documents are in the documents table?",
              call: JSON.stringify({
                database_id: "secondbrain",
                sql_query: "SELECT * FROM documents",
              }),
            },
            {
              prompt:
                "Do we have anyone in the staff table for our production db named 'sam'? ",
              call: JSON.stringify({
                database_id: "secondbrain",
                sql_query:
                  "SElECT * FROM staff WHERE first_name='sam%' OR last_name='sam%'",
              }),
            },
            {
              prompt: "Please add John Doe to my contacts table. His full name is John Doe, his preferred name is John, his date of birth is 1990-01-01, his phone number is 123-456-7890, his email is john.doe@example.com, his address is 123 Main St, his social profiles are {\"linkedin\": \"linkedin.com/in/johndoe\"}, his family details are {\"wife\": \"Jane Doe\"}, his interests are {\"reading\", \"hiking\"}, his important dates are {\"anniversary\": \"2020-02-22\"}, his personality notes are Friendly and outgoing, and other details are Likes coffee.",
              call: JSON.stringify({
                database_id: "secondbrain",
                sql_query: "INSERT INTO contacts (full_name, preferred_name, date_of_birth, phone, email, address, social_profiles, family_details, interests, important_dates, personality_notes, other_details) VALUES ('John Doe', 'John', '1990-01-01', '123-456-7890', 'john.doe@example.com', '123 Main St', '{\"linkedin\": \"linkedin.com/in/johndoe\"}', '{\"wife\": \"Jane Doe\"}', '{\"reading\", \"hiking\"}', '{\"anniversary\": \"2020-02-22\"}', 'Friendly and outgoing', 'Likes coffee')",
              }),
            },
            {
              prompt: "Can you update Jane Smith's contact information? Her email is jane.smith@example.com. I want to update her phone number to 555-123-4567, add a new interest 'photography', and update her address to '456 Oak Avenue'. Also add a note to her personality_notes that she's 'Great at organizing events'.",
              call: JSON.stringify({
                database_id: "secondbrain",
                sql_query: "UPDATE contacts SET phone = '555-123-4567', interests = array_append(interests, 'photography'), address = '456 Oak Avenue', personality_notes = CASE WHEN personality_notes IS NULL THEN 'Great at organizing events' ELSE personality_notes || '. Great at organizing events' END, updated_at = CURRENT_TIMESTAMP WHERE email = 'jane.smith@example.com'",
              }),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              database_id: {
                type: "string",
                description:
                  "The database identifier for which we will connect to to query the table schema. This is required to run the SQL query.",
              },
              sql_query: {
                type: "string",
                description:
                  "The raw SQL query to run. Should be a query which does not modify the table and will return results.",
              },
            },
            additionalProperties: false,
          },
          required: ["database_id", "table_name"],
          handler: async function ({ database_id = "", sql_query = "" }) {
            this.super.handlerProps.log(`Using the sql-query tool.`);
            try {
              const databaseConfig = (await listSQLConnections()).find(
                (db) => db.database_id === database_id
              );
              if (!databaseConfig) {
                this.super.handlerProps.log(
                  `sql-query failed to find config!`,
                  database_id
                );
                return `No database connection for ${database_id} was found!`;
              }

              this.super.introspect(
                `${this.caller}: Im going to run a query on the ${database_id} to get an answer.`
              );
              const db = getDBClient(databaseConfig.engine, databaseConfig);

              this.super.introspect(`Running SQL: ${sql_query}`);
              const result = await db.runQuery(sql_query);
              if (result.error) {
                this.super.handlerProps.log(
                  `sql-query tool reported error`,
                  result.error
                );
                this.super.introspect(`Error: ${result.error}`);
                return `There was an error running the query: ${result.error}`;
              }

              return JSON.stringify(result);
            } catch (e) {
              console.error(e);
              return e.message;
            }
          },
        });
      },
    };
  },
};
