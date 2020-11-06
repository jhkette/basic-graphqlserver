const graphql = require("graphql");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = graphql;
// desctuture all these types to define GraphQlobjects - they are used to describe fields.

const axios = require("axios");


// Each of these is essentially a 'table' in a database schema
// This is the company type
const CompanyType = new GraphQLObjectType({
  name: "Company",
  //   wrap fields in afunction so its
  // in function closure scope - gets read after file contents are compiled. If we don't w
  // we get circular reference - where two object pass references to each other
  // https://www.tutorialspoint.com/why-circular-reference-is-bad-in-javascript#:~:text=A%20circular%20reference%20occurs%20if,is%20no%20longer%20an%20issue.
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString},
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then((res) => res.data);
      },
    },
  }),
});

// This is the the usertype
const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    // it also is linked to the CompanyType
    // we then get the data for the company of the user from axios
    // this is essentially how you link tables in graphql
    company: {
      type: CompanyType,
      // we use the parentvalue(ie the user) to get access to user.companyId and make api call
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then((resp) => resp.data);
      },
    },
  }),
});

// Rootquery - this defines  graphql queries you can make
// and uses axios to return data
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      // user type
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/users/${args.id}`)
          .then((resp) => resp.data);
      },
    },
    company: {
      // company type
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then((resp) => resp.data);
      },
    },
  },
});

// mutations
// ie making change to data using graphql , they are listed here
// addUser, deleteUser, editUser etc
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, { firstName, age }) {
        return axios
          .post("http://localhost:3000/users", { firstName, age })
          .then((res) => res.data);
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parentValue, { id }) {
        return axios
          .delete(`http://localhost:3000/users/${id}`)
          .then((res) => res.data);
      },
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, args){
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
        .then(res => res.data)
    }
    },
    
  },
});
// export graphQL string - this gets added to this
// app.use('/graphql', graphqlHTTP({
//   schema,
//   graphiql: true
// }));
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
});
