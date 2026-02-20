
import express, { Request, Response } from 'express';
import router from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { setupErrorHandlers } from './utils/errorHandler';
import { sequelize } from './models/mmsql'; // ✅ MSSQL Sequelize instance
import { testConnections } from './db';
import { syncPostgresModels } from './models/postgres';
import dotenv from 'dotenv';
import cors from 'cors';
import { seedEpickSetting, seedHomeSetting, seedPolicies, seedWarehouseSetting, seedInvoiceSetting } from './seeder/wareHouseSetting.seeder';
import { seedEmailModules } from './seeder/emailModule.seeder';
import { seedInvoiceTemplates } from './seeder/invoiceTemplate.seeder';
import { startCronJobs } from './cron'; // adjust path if needed
import { getAllowedSalesCategories, getDiscount, getPrepaidTaxRate } from './utils/helper';
import moment from 'moment';
import './workers/emailWorker'; // Start the email worker
import './workers/emailNotificationWorker'; // Start the email notification worker
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, emailNotificationQueue, testRedisConnection } from './configuration/config';
import { getNextVendorNumber } from './utils/vendor';
import { OrderHeader } from './models/mmsql/orderHeader.model';
import { apiLoggerMiddleware } from './middlewares/apiLogger.middleware';

startCronJobs();




dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use(apiLoggerMiddleware);

// Bull Board UI Setup for Redis Queue Monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(emailNotificationQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.get('/',(async(req:Request,res:Response)=>{
  const data = await getPrepaidTaxRate(1,1);
  console.log(data,'the data')
  res.json({data});
}))


app.get('/checkServerDate',(async(req:Request,res:Response)=>{
  const now = moment();
  const today = now.format('YYYY-MM-DD'); // current date
  const currentTime = now.format('HH:mm:ss'); // current time
  const fiveMinutesLater = now.add(5, 'minutes').format('HH:mm:ss'); // current + 5 minutes

  res.json({today,currentTime,fiveMinutesLater});
}))
app.post('/checkUrl',(req:Request,res:Response)=>{
  console.log(req.body)
  const {url} = req.body;
   if(url === process.env.SERVER_URL){
    res.status(200).json({message:'Url is valid'});
   }else{
    res.status(400).json({message:'Url is not valid'});
   }
})

app.get('/testPrepaidTaxRate',(async(req:Request,res:Response)=>{
  const data = await getPrepaidTaxRate(1,1);
  console.log(data,'the data')
  res.json({data});
}))

app.use('/api', router);

app.get('/testPrice',(async(req:Request,res:Response)=>{
  const data = await getDiscount(1016 ,11187);
  res.json({data});
}))




app.get('/testInventory',(async(req:Request,res:Response)=>{
  const date = moment().format('YYYY-MM-DD');

  const currentOrderInventory = await OrderHeader.findAll({
    where:{
      Order_Updated: false,
      Order_Date: date
    }
  })
  res.json({currentOrderInventory});
}))

app.get('/testSalesCategory',(async(req:Request,res:Response)=>{
  const data = await getAllowedSalesCategories(5000);
  res.json({data});
}))




app.get('/testVendor',(async(req:Request,res:Response)=>{
  
  const data = await getNextVendorNumber();
  res.json({data});
}))

app.get('/test',(async(req:Request,res:Response)=>{
  res.json({message:'Hello World'});
}))

// console.log(process.env.CI,'the ci')

// Global error handling setup
setupErrorHandlers(app);
app.use(errorHandler);

// 🛠 Safe MSSQL sync with retry logic for deadlocks
async function safeMssqlSync() {
  const modelsToSync = Object.values(sequelize.models).filter(
    (model) =>
      model.tableName !== 'discoutViews' && model.tableName !== 'GetDiscount' &&
      model.tableName !== 'Order_Header' && model.tableName !== 'Order_Detail'
  );
  

  for (const model of modelsToSync) {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Syncing MSSQL model: ${model.tableName} (attempt ${retryCount + 1})`);
        // await model.sync({ alter: true });
        console.log(`✅ Synced: ${model.tableName}`);
        break; // Success, exit retry loop
      } catch (err: any) {
        retryCount++;
        
        // Check if it's a deadlock error
        if (err.code === 'EREQUEST' && err.number === 1205) {
          console.warn(`⚠️ Deadlock detected for ${model.tableName}, retrying... (${retryCount}/${maxRetries})`);
          
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
        }
        
        // If it's not a deadlock or we've exhausted retries
        console.log(err,'the err')
        console.warn(`⚠️ Failed to sync ${model.tableName}: ${err.message}`);
        break;
      }
    }
  }
}

// Startup sequence
testConnections()
  .then(async () => {
    console.log('✅ Connected to both databases');

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      console.warn('⚠️ Redis connection failed. Email queue may not work properly.');
    }

    await syncPostgresModels();
    console.log('✅ PostgreSQL models synchronized');

    await safeMssqlSync();
    console.log('✅ MSSQL models synchronized (excluding views)');
    await seedWarehouseSetting();
    await seedHomeSetting();
    await seedEpickSetting();
    await seedInvoiceSetting();
    await seedPolicies();
    console.log('✅ Policies seeded');
    await seedEmailModules();
    await seedInvoiceTemplates();
    app.listen(Number(PORT),'localhost', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Dual database setup: MSSQL + PostgreSQL`);
      console.log(`📧 Redis Queue UI available at http://localhost:${PORT}/admin/queues`);
    });
  })
  .catch((error: Error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });

