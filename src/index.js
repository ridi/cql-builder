/**
 * Cassandra CQL Query builder
 * @link https://docs.datastax.com/en/cql/3.1/cql/cql_reference/cqlCommandsTOC.html
 *
 * @author kyungmi.k
 * @since 1.0.0
 */

const COMMANDS = Object.freeze({
  insert: {
    name: 'INSERT',
    query: context => `INSERT INTO ${context.table} ${context.value} ${context.option}`,
    using: ['table', 'value', 'option'],
  },
  select: {
    name: 'SELECT',
    query: context => `SELECT ${context.field} FROM ${context.table} ${context.where} ${context.order} ${context.limit}`,
    using: ['field', 'table', 'where', 'order', 'limit'],
  },
  update: {
    name: 'UPDATE',
    query: context => `UPDATE ${context.table} ${context.option} SET ${context.set} ${context.where} ${context.condition}`,
    using: ['table', 'option', 'set', 'where', 'condition'],
  },
  delete: {
    name: 'DELETE',
    query: context => `DELETE ${context.field === '*' ? '' : context.field} FROM ${context.table} ${context.option} ${context.where}`,
    using: ['field', 'table', 'option', 'where'],
  },
});

const EXPRESSIONS = Object.freeze({
  field: exp => `${exp.field.length === 0 ? '*' : exp.field.join(', ')}`,
  table: exp => `${exp.keyspace ? `${exp.keyspace}.` : ''}${exp.table}`,
  where: exp => `${exp.where.length === 0 ? '' : `WHERE ${exp.where.join(' AND ')}`}`,
  order: exp => `${exp.order ? `ORDER BY ${exp.order}` : ''}`,
  limit: exp => `${exp.limit ? 'LIMIT ?' : ''}`,
  value: exp => `(${exp.value.join(', ')}) VALUES (${exp.value.map(() => '?').join(', ')})`,
  set: exp => `${exp.set.map(field => `${field} = ?`).join(', ')}`,
  option: exp => `${exp.option.length === 0 ? '' : `USING ${exp.option.map(option => `${option} ?`).join(' AND ')}`}`,
  condition: exp => `${exp.upsert ? '' : 'IF EXISTS'}`,
});

class CqlBuilderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CqlBuilderError';
  }
}

class CqlBuilder {
  constructor(command) {
    this.command = command;
    this.clear();
  }

  table(table, keyspace) {
    this.exps.keyspace = keyspace;
    this.exps.table = table;
    return this;
  }

  field(field) {
    this.exps.field = this.exps.field.concat(field);
    return this;
  }

  where(where, ...values) {
    const testParams = where.match(/\?/g);
    const numberOfParams = testParams ? testParams.length : 0;
    if (values.length !== numberOfParams) {
      throw new CqlBuilderError('The values length must be same with the number of parameters in given where statement.');
    }
    this.exps.where.push(where);
    this.vals.where = this.vals.where.concat(values);
    return this;
  }

  order(order) {
    this.exps.order = order;
    return this;
  }

  limit(limit) {
    this.exps.limit = limit > 0;
    this.vals.limit = limit;
    return this;
  }

  value(field, value) {
    this.exps.value.push(field);
    this.vals.value.push(value);
    return this;
  }

  set(field, value) {
    this.exps.set.push(field);
    this.vals.set.push(value);
    return this;
  }

  option(option, value) {
    this.exps.option.push(option);
    this.vals.option.push(value);
    return this;
  }

  upsert(upsert) {
    this.exps.upsert = !!upsert;
    return this;
  }

  clear() {
    this.exps = {
      keyspace: null,
      table: null,
      field: [],
      where: [],
      limit: false,
      order: null,
      value: [],
      option: [],
      set: [],
      upsert: false,
    };
    this.vals = {
      where: [],
      limit: 0,
      value: [],
      option: [],
      set: [],
    };
    return this;
  }

  /**
   * Make CQL (prepared-)statement with given informations
   *
   * @returns {{cql: string, params: Array}} - Returns CQL statement string and its parameter values
   */
  build() {
    if (!this.exps.table) {
      throw new CqlBuilderError('table() must be set.');
    }

    const context = {};
    let params = [];

    this.command.using.forEach((exp) => {
      context[exp] = EXPRESSIONS[exp](this.exps);
      if (this.vals[exp]) {
        params = params.concat(this.vals[exp]);
      }
    });

    return {
      query: this.command.query(context).trim().replace(/\s+/g, ' '),
      params,
    };
  }
}

const Insert = () => new CqlBuilder(COMMANDS.insert);
const Select = () => new CqlBuilder(COMMANDS.select);
const Update = () => new CqlBuilder(COMMANDS.update);
const Delete = () => new CqlBuilder(COMMANDS.delete);
export { Insert, Select, Update, Delete, CqlBuilderError };
