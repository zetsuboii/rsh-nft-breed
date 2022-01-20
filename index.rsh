'reach 0.1';

// Helpers
const getPrice = (p) => {
	return p.match({
		NotForSale: () => { return 0 },
		ForSale: (v) => { return v } 
	});
};

// Types
const NftParams = Object({
  name: Bytes(32),
  props: Array(UInt, 5)
});

const Price = Data({
  NotForSale: Null,
  ForSale: UInt
});

// Interfaces
const CreatorInterface = {
  getParams: Fun([], NftParams),
  informDeploy: Fun([], Null),
  informBurn: Fun([], Null)
};

const UserApiInterface = {
  // transferTo
  transferTo: Fun([Address], Bool),
  // list
  list: Fun([UInt], Bool),
  // buy
  buy: Fun([], Bool),
  // burn
  burn: Fun([], Bool)
};

const ViewInterface = {
  name: Bytes(32),
  props: Array(UInt, 5),
  owner: Address,
  price: Price
};

export const main = Reach.App(() => {
  const Creator = Participant('Creator', CreatorInterface);
  const User = API('User', UserApiInterface);
  const Views = View(ViewInterface);
  init();
  
  Creator.only(() => {
    const { name, props } = declassify(interact.getParams()); 
  });
  Creator.publish(name, props);
  commit();

  Creator.interact.informDeploy();
  Creator.publish();
  Views.name.set(name);
  Views.props.set(props);

  const creatorAddress = Creator;
  const initialState = {
    owner: Creator,
    price: Price.NotForSale(),
    burned: false
  };

  const state = parallelReduce(initialState)
    .invariant(balance() == 0)
    .while(!state.burned)
    .define(() => {
      Views.owner.set(state.owner);
      Views.price.set(state.price);
    })
    .api(
      User.transferTo, 
      // Assumes
      ((_) => {
        assume(this == state.owner);
      }),
      // Payments
      ((_) => 0),
      // Consensus
      ((to, ok) => {
        require(this == state.owner);
        ok(true);

        return { 
          ...state, 
          owner: to,
          price: Price.NotForSale()
        };
      })
    )
    .api(
      User.list,
      // Assumes
      ((_) => {
        assume(this == state.owner);
      }),
      // Payments
      ((_) => 0),
      // Consensus
      ((newPrice, ok) => {
        require(this == state.owner);
        ok(true);

        return {
          ...state,
          price: Price.ForSale(newPrice)
        };
      })
    )
    .api(
      User.buy,
      // Assumes
      (() => {
        assume(this != state.owner);
        assume(state.price != Price.NotForSale());
      }),
      // Payments
      (() => getPrice(state.price)),
      // Consensus
      ((ok) => {
        require(this != state.owner);
        require(state.price != Price.NotForSale());
        ok(true);

        transfer(balance()).to(state.owner);
        return {
          ...state,
          owner: this,
          price: Price.NotForSale()
        };
      })
    )
    .api(
      User.burn,
      // Assumes
      (() => {
        assume(this == creatorAddress);
      }),
      // Payments
      (() => 0),
      // Consensus
      ((ok) => {
        require(this == creatorAddress);
        ok(true);

        return {
          owner: this,
          price: Price.NotForSale(),
          burned: true
        };
      })
    )
    .timeout(false);

    Creator.interact.informBurn();
    commit();
    exit();
});