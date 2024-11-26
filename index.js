import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const pool = new Pool({
    user: process.env.user,
    host:process.env.host,
    database: process.env.database,
    password: process.env.password,
    port: process.env.port,
});
app.set('view engine','ejs')
app.get('/',(req,res)=>{res.render('index',{title:'Express'})})

app.get('/salary',async(req,res)=>{
    const result=await pool.query('select * from salary_details where id=$1',[1]);
    res.render('salary',{salary:result.rows});
})


app.post('/salary',async(req,res)=>{
    const { id } = 1;
    const { basic_pay, da, hra, deductions } = req.body;
    const net_salary = parseFloat(basic_pay) + parseFloat(da) + parseFloat(hra) - parseFloat(deductions);

    try {
        await pool.query(
            'UPDATE salary_details SET basic_pay = $1, da = $2, hra = $3, deductions = $4, net_salary = $5 WHERE id = $6',
            [basic_pay, da, hra, deductions, net_salary, id]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating salary details.');
    }
})




app.get('/money/delete/:id', async (req, res) => {
    try {
        // Use DELETE FROM to remove the row with the specified ID
        const result = await pool.query('DELETE FROM moneylent WHERE id = $1', [req.params.id]);
        res.redirect('/money'); // Redirect back to the /money page after deletion
    } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).send('Error deleting record.');
    }
});


app.get('/loan/delete/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM loan WHERE id = $1', [req.params.id]);
        res.redirect('/loans');
    } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).send('Error deleting record.');
    }
});


app.get('/dashboard', async(req, res) => {
    const result= await pool.query('SELECT * FROM expense');
    const salary=await pool.query('select net_salary from salary_details where id=1');
    const total=await pool.query('select sum(amount) from expense');
    const budget=await pool.query('select total from budget order by id desc limit 1');
    const result2=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['food']);
    const result3=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['entertainment']);
    const result4=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['transport']);
    const result5=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['bills']);
    const result6=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['other']);
    res.render('dashboard', { budget:budget.rows,salary:salary.rows,expense: result.rows,data1:result2.rows,data2:result3.rows,data3:result4.rows,data4:result5.rows,data5:result6.rows,total:total.rows});
})

app.get('/sumoffood/',async(req,res)=>{
    const result=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['food']);
    console.log(result.rows[0]);
})



app.get('/loan/edit/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM loan WHERE id = $1', [req.params.id]);
        console.log(result.rows[0]);
        res.render('loanedit', { loan: result.rows[0] });
    } catch (err) {
        console.error('Error fetching loan data:', err);
        res.status(500).send('Error fetching loan data');
    }
});
app.post('/loan/edit/:id', async (req, res) => {
    try {
        const dueAmount = req.body.amount-req.body.paid;
        await pool.query(
            'UPDATE loan SET org = $1, amount = $2, rate = $3, repaymentdate = $4, paid = $5, dueamount = $6 WHERE id = $7',
            [req.body.organisation, req.body.amount, req.body.rate, req.body.repaymentdate, req.body.paid, dueAmount, req.params.id]
        );
        res.redirect('/loans');
    } catch (err) {
        console.error('Error updating loan data:', err);
        res.status(500).send('Error updating loan data');
    }
}
);

app.get('/money/edit/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM moneylent WHERE id = $1', [req.params.id]);
        console.log(result.rows[0]);
        res.render('moneylentedit', { moneylent: result.rows[0] });
    } catch (err) {
        console.error('Error fetching loan data:', err);
        res.status(500).send('Error fetching loan data');
    }
});
app.post('/money/edit/:id', async (req, res) => {
    try {
        await pool.query(
            'UPDATE moneylent SET person = $1, amount = $2, duedate = $3, amountdue = $4 WHERE id = $5',
            [req.body.person, req.body.amount, req.body.duedate, req.body.amountdue, req.params.id]
        );
        res.redirect('/money');
    } catch (err) {
        console.error('Error updating loan data:', err);
        res.status(500).send('Error updating loan data');
    }
}
);



//money page
app.get('/money', async(req, res) => {
    const result= await pool.query('SELECT * FROM expense');
    const result2= await pool.query('SELECT * FROM moneylent');
    const result7=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['food']);
    const result3=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['entertainment']);
    const result4=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['transport']);
    const result5=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['bills']);
    const result6=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['other']);
    const perandamount = await pool.query('SELECT person, amountdue FROM moneylent'); 
        const persons = perandamount.rows.map(row => row.person);
        const amountdue = perandamount.rows.map(row => parseFloat(row.amountdue));
    res.render('money', {expense: result.rows,moneylent: result2.rows,data1:result7.rows,data2:result3.rows,data3:result4.rows,data4:result5.rows,data5:result6.rows,persons: persons,
            amountdue: amountdue});
})
app.post('/expense', async(req, res) => {
    const result= await pool.query('INSERT INTO expense (category,amount,date,description) VALUES ($1,$2,$3,$4)',[req.body.category,req.body.amount,req.body.date,req.body.description]);
    res.redirect('/money');});

app.post('/moneylent', async(req, res) => {
    const result= await pool.query('INSERT INTO moneylent (person,amount,duedate,amountdue) VALUES ($1,$2,$3,$4)',[req.body.person,req.body.amount,req.body.duedate,req.body.amountdue]);
    res.redirect('/money');}
);

app.post('/loan', async (req, res) => {
    console.log(req.body);
    try {
        const dueAmount = req.body.amount-req.body.paid;
        await pool.query(
            'INSERT INTO loan (org, amount, rate, repaymentdate, paid, dueamount) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.body.organisation, req.body.amount, req.body.rate, req.body.repaymentdate, req.body.paid, dueAmount]
        );
        res.redirect('/loans');
    } catch (err) {
        console.error('Error inserting loan data:', err);
        res.status(500).send('Error saving loan data');
    }
});

app.get('/loans', async(req, res) => {
    const result= await pool.query('SELECT * FROM loan');
    const totalloan=await pool.query('select sum(amount) from loan');
    const paid=await pool.query('select sum(paid) from loan');
    const due=await pool.query('select sum(dueamount) from loan');
    res.render('loans', { loans: result.rows,total:result.rowCount,sum:totalloan.rows,paid:paid.rows,due:due.rows});
})


//budget page
app.get('/budget', async(req, res) => {
    const result= await pool.query('SELECT * FROM budget ORDER BY id DESC LIMIT 1;');
    const result2=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['food']);
    const result3=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['entertainment']);
    const result4=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['transport']);
    const result5=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['bills']);
    const result6=await pool.query('SELECT SUM(amount) FROM expense WHERE category =$1;',['other']);
console.log(result6.rows);
    console.log(result.rows);
    res.render('budget', { data: result.rows,data1:result2.rows,data2:result3.rows,data3:result4.rows,data4:result5.rows,data5:result6.rows});
})

app.post('/budget', async (req, res) => {
    console.log(req.body);
    const total=parseFloat(req.body.food)+parseFloat(req.body.entertainment)+parseFloat(req.body.transport)+parseFloat(req.body.bills)+parseFloat(req.body.other);
    console.log(total);
    try {
        await pool.query(
            'INSERT INTO budget (food, entertainment, transport, bills, other,total) VALUES ($1, $2, $3, $4, $5,$6)',
            [req.body.food, req.body.entertainment, req.body.transport, req.body.bills, req.body.other,total]
        );
        res.redirect('/budget');
    } catch (err) {
        console.error('Error inserting budget:', err);
        res.status(500).send('Error inserting budget');
    }
});




app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});