export const sleep = async (seconds) => {
  await new Promise(res => setTimeout(res, seconds * 1000));
}

export const waitFor = async (condGet) => {
  await new Promise(async (resolve, reject) => {
    let tries = 0;
    while(tries < 5) {
      if(condGet()) resolve();
      await sleep(5);
      tries++;
    }
    reject("Wait failed");
  });
}
