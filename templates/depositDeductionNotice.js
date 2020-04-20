export class DepositDeductionNotice {
  repairs_cost = 0;
  is_repairs = false;
  unpaid_rent = 0;
  is_unpaid_rent = false;
  lessor = {};
  tenant = {};

  constructor(){
    this.observe([this, 'is_repairs'], val => {
      if(val == false){
        this.repairs_description = null
        this.repairs_cost = 0;
      }
    })

    this.observe([this, 'is_unpaid_rent'], val => {
      if(val == false){
        this.unpaid_rent = 0;
      }
    })

    this.observe([this, 'deposit'], [this, 'repairs_cost'], [this, 'unpaid_rent'], val => {
      let debt = this.repairs_cost + this.unpaid_rent;
      if( debt <= this.deposit ) this.is_billed_to_guarantor = null;
    })
  }
}
