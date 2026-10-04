const question = (prompt, options, correctAnswer, explanation) => ({ prompt, options, correctAnswer, explanation });
const topic = (id, title, description, content, example, practical, questions) => ({ id, title, estimatedTime: '30-45 minutes', description, content, example, practical, questions });

const SQL_PATH = {
  description: 'Query, transform, and analyze the business data behind a Data Analyst role.',
  topics: [
    topic('sql-select', 'SELECT and WHERE', 'Retrieve only the data needed for a question.', 'SELECT chooses columns. WHERE filters rows before the result is returned.', 'SELECT customer_id, total FROM orders WHERE total > 100;', 'Find customers whose orders exceed a chosen revenue threshold.', [question('Which clause filters rows?', ['ORDER BY', 'WHERE', 'GROUP BY', 'JOIN'], 1, 'WHERE filters rows before they are returned.'), question('Which statement selects two columns?', ['SELECT name, city FROM customers;', 'GET name, city FROM customers;', 'COLUMNS name, city FROM customers;', 'RETURN name, city FROM customers;'], 0, 'SELECT lists the columns returned by a query.'), question('What does a WHERE condition evaluate?', ['Rows', 'Table names only', 'Column definitions only', 'Indexes only'], 0, 'WHERE evaluates each row against a condition.')]),
    topic('sql-order', 'ORDER BY and LIMIT', 'Sort query results and control how many rows you inspect.', 'ORDER BY sorts ascending or descending. LIMIT is useful for top results and quick exploration.', 'SELECT product, revenue FROM sales ORDER BY revenue DESC LIMIT 5;', 'Find the five best-selling products in a sales table.', [question('Which keyword sorts results?', ['SORT', 'ORDER BY', 'ARRANGE', 'RANK'], 1, 'ORDER BY sorts rows in the requested direction.'), question('What does DESC mean?', ['Descending', 'Description', 'Decentralized', 'Decreasing columns'], 0, 'DESC sorts from high to low or Z to A.'), question('What does LIMIT 10 do?', ['Returns at most 10 rows', 'Filters value 10', 'Creates 10 columns', 'Groups 10 tables'], 0, 'LIMIT caps the number of returned rows.')]),
    topic('sql-aggregates', 'Aggregate Functions', 'Summarize business data with COUNT, SUM, AVG, MIN, and MAX.', 'Aggregate functions turn many rows into a useful summary value.', 'SELECT COUNT(*) AS orders, SUM(total) AS revenue FROM orders;', 'Calculate order volume and total revenue for a reporting period.', [question('Which function counts rows?', ['SUM()', 'AVG()', 'COUNT()', 'TOTAL()'], 2, 'COUNT() returns the number of rows or non-null values.'), question('Which function adds numeric values?', ['ADD()', 'SUM()', 'PLUS()', 'TOTALIZE()'], 1, 'SUM() adds values in a numeric column.'), question('What does AVG() calculate?', ['The middle row', 'The average value', 'The largest value', 'The number of groups'], 1, 'AVG() calculates the arithmetic mean.')]),
    topic('sql-group', 'GROUP BY and HAVING', 'Create summaries by customer, product, region, or another category.', 'GROUP BY forms groups before aggregate functions run. HAVING filters groups after aggregation.', 'SELECT region, SUM(revenue) AS total FROM sales GROUP BY region HAVING SUM(revenue) > 10000;', 'Compare revenue by region and keep only meaningful segments.', [question('What does GROUP BY create?', ['Groups for aggregation', 'A new database', 'A sort order only', 'A filter before rows load'], 0, 'GROUP BY collects rows with the same category values.'), question('Which clause filters aggregate groups?', ['WHERE', 'HAVING', 'LIMIT', 'ORDER BY'], 1, 'HAVING filters after grouping and aggregation.'), question('Where should a row-level filter go?', ['WHERE', 'HAVING only', 'GROUP BY', 'SELECT'], 0, 'WHERE filters rows before groups are formed.')]),
    topic('sql-joins', 'JOINs', 'Combine related tables such as customers, orders, and products.', 'A JOIN connects tables through related columns. INNER JOIN keeps matches; LEFT JOIN keeps every row from the left table.', 'SELECT customers.name, orders.total FROM customers INNER JOIN orders ON customers.id = orders.customer_id;', 'Connect customer details to order history for customer-value analysis.', [question('Which JOIN keeps every left-table row?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], 1, 'LEFT JOIN keeps all left rows and matching right rows.'), question('Which JOIN returns only matching rows?', ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], 2, 'INNER JOIN keeps rows with a match on both sides.'), question('What connects two tables in a JOIN?', ['A related condition', 'A chart', 'A database password', 'A LIMIT value'], 0, 'The ON condition states how related rows match.')]),
    topic('sql-subqueries', 'Subqueries', 'Use a query inside another query to answer layered questions.', 'A subquery can provide a filter value, derived table, or comparison set to an outer query.', 'SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);', 'Find products priced above the average product price.', [question('What is a subquery?', ['A query inside another query', 'A deleted query', 'A table backup', 'A database user'], 0, 'A subquery is nested inside an outer SQL statement.'), question('What can a scalar subquery return?', ['One value', 'Only a table name', 'A chart', 'A database connection'], 0, 'A scalar subquery returns a single value for comparison.'), question('Why use a subquery?', ['To break a complex question into steps', 'To remove all rows', 'To rename the database', 'To avoid SELECT'], 0, 'Subqueries make layered comparisons and filters possible.')]),
    topic('sql-case', 'CASE Statements', 'Create business labels and conditional measures in a query.', 'CASE evaluates conditions from top to bottom and returns the first matching result.', "SELECT order_id, CASE WHEN total >= 500 THEN 'High' ELSE 'Standard' END AS segment FROM orders;", 'Label orders for a sales report without changing stored data.', [question('What does CASE return?', ['A value based on conditions', 'A new table always', 'Only errors', 'A connection'], 0, 'CASE returns the value for the first true condition.'), question('What keyword handles the fallback?', ['OTHER', 'ELSE', 'DEFAULT ROW', 'FALLBACK'], 1, 'ELSE provides the fallback result.'), question('When are CASE conditions evaluated?', ['Top to bottom', 'Randomly', 'Alphabetically', 'Only after sorting'], 0, 'SQL uses the first matching WHEN branch.')]),
    topic('sql-window', 'Window Functions', 'Compare rows while keeping the detail of each row.', 'Window functions calculate across related rows without collapsing them like GROUP BY does.', 'SELECT employee, revenue, RANK() OVER (ORDER BY revenue DESC) AS rank FROM sales;', 'Rank salespeople while keeping each person and their revenue visible.', [question('What does a window function preserve?', ['Individual rows', 'Only one summary row', 'No columns', 'The database schema'], 0, 'Window functions add calculations without collapsing rows.'), question('Which function creates a rank?', ['RANK()', 'ORDER()', 'POSITION()', 'LEVEL()'], 0, 'RANK() assigns an ordering position.'), question('What defines a window calculation?', ['OVER()', 'WINDOW BY only', 'RANGE()', 'FRAME ONLY'], 0, 'OVER() defines the rows and ordering used by the function.')]),
  ],
};

const simplePath = (description, topicTitles, examplePrefix) => ({
  description,
  topics: topicTitles.map((title, index) => topic(`topic-${index + 1}`, title, `Build practical ${title.toLowerCase()} skills for your target role.`, `Learn the core ideas behind ${title.toLowerCase()}, when to use them, and how they support real work.`, `${examplePrefix}: apply ${title.toLowerCase()} to a small career-focused dataset or project.`, `Practice ${title.toLowerCase()} using a realistic ${examplePrefix.toLowerCase()} example.`, [question(`Which statement best describes ${title}?`, [`It is a practical skill used in ${examplePrefix}.`, 'It is only a decorative UI feature.', 'It replaces all other skills.', 'It is unrelated to this career path.'], 0, `${title} is included because it supports the selected career direction.`), question(`What is a good way to practice ${title}?`, ['Use a realistic project', 'Skip examples', 'Memorize the title only', 'Avoid applying it'], 0, 'A realistic project builds understanding and evidence.'), question(`When should you mark this topic complete?`, ['After opening it', 'After passing the practice check', 'Before reading it', 'Never'], 1, 'Completion follows study and successful practice.')])),
});

export const LEARNING_PATHS = {
  sql: SQL_PATH,
  excel: simplePath('Analyze and visualize business data with spreadsheets.', ['Excel Basics', 'Formulas and Functions', 'IF / COUNTIF / SUMIF', 'VLOOKUP / XLOOKUP', 'INDEX and MATCH', 'Data Cleaning', 'Pivot Tables', 'Charts and Visualization'], 'Sales worksheet'),
  pandas: simplePath('Prepare, clean, and analyze data with Python DataFrames.', ['Series and DataFrames', 'Loading Data', 'Selecting and Filtering Data', 'Handling Missing Values', 'Data Cleaning', 'GroupBy', 'Merge and Join', 'Data Analysis'], 'CSV sales dataset'),
  'data visualization': simplePath('Communicate data clearly through charts and dashboards.', ['Visualization Fundamentals', 'Choosing the Right Chart', 'Matplotlib', 'Seaborn', 'Distribution Plots', 'Comparison Charts', 'Correlation Visualization', 'Dashboard Principles'], 'Revenue report'),
  python: simplePath('Build reliable Python foundations for analysis and development.', ['Variables and Data Types', 'Conditions', 'Loops', 'Functions', 'Lists and Dictionaries', 'Exception Handling', 'File Handling', 'OOP'], 'Python data tool'),
  javascript: simplePath('Build interactive web behavior with modern JavaScript.', ['Variables', 'Data Types', 'Functions', 'Arrays and Objects', 'DOM', 'Events', 'Promises', 'Async/Await'], 'Browser application'),
  'react js': simplePath('Create maintainable component-based web interfaces.', ['Components', 'JSX', 'Props', 'State', 'Events', 'Hooks', 'React Router', 'API Integration'], 'React dashboard'),
  'machine learning': simplePath('Build and evaluate practical predictive models.', ['ML Fundamentals', 'Data Preprocessing', 'Train/Test Split', 'Regression', 'Classification', 'Feature Engineering', 'Model Evaluation', 'Hyperparameter Tuning'], 'prediction project'),
};

export const normalizeLearningSkill = (skill) => {
  const value = String(skill || '').trim().toLowerCase().replace(/\.js$/, ' js').replace(/\s+/g, ' ');
  const aliases = { js: 'javascript', javascript: 'javascript', react: 'react js', 'react js': 'react js', mysql: 'sql', 'power bi': 'power bi' };
  return aliases[value] || value;
};

export const getLearningPath = (skill, roleTitle = '') => {
  const path = LEARNING_PATHS[normalizeLearningSkill(skill)];
  if (!path) return null;
  return { ...path, roleTitle, skillName: skill };
};

export const getProgressKey = (userId, roleId) => `profile_master_skill_upgrade_${userId || 'guest'}_${roleId}`;
export const getSelectionKey = (userId) => `profile_master_skill_upgrade_selection_${userId || 'guest'}`;

export const readLearningSelection = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getSelectionKey(userId)) || '{}');
  } catch {
    return {};
  }
};

export const writeLearningSelection = (userId, selection) => {
  localStorage.setItem(getSelectionKey(userId), JSON.stringify(selection));
};

export const readLearningProgress = (userId, roleId) => {
  try {
    return JSON.parse(localStorage.getItem(getProgressKey(userId, roleId)) || '{}');
  } catch {
    return {};
  }
};

export const writeLearningProgress = (userId, roleId, progress) => {
  localStorage.setItem(getProgressKey(userId, roleId), JSON.stringify(progress));
};
