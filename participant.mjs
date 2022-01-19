export class Participant {
    constructor(account) {
      this.account = account;
    } 
    
    getAddress() {
      return this.account.networkAccount.addr ?? this.account.networkAccount.address;
    }
  
    getContractInfo() {
      return this.contract.getInfo();
    } 
  
    async getDeployInfo() {
      return JSON.stringify(await this.contract.getInfo());
    }
  
    deploy(backend) {
      this.backend = backend;
      this.contract = this.account.contract(backend);
    }
  
    attach(backend, info) {
      this.backend = backend;
      this.contract = this.account.contract(backend, info);
    }
  
    async view(group, name, ...args) {
      const views = group != undefined 
        ? this.contract.v[group]
        : this.contract.v;
  
      const result = await views[name](...args)
      return result[0] === "Some" ? result[1] : null;
    }
  
    async call(group, name, ...args) {
      if(this.contract == null) throw new Error("Contract is undefined");
      
      const apis = group != undefined
        ? this.contract.a[group]
        : this.contract.a;
      
      const result = await apis[name](...args);
      return result[1]
    }
  
    async run(role, iface) {
      if(!this.contract) throw new Error("No contract");
      await this.contract.p[role](iface);
    }
  }