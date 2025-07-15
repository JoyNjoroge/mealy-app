from models import db, Admin, User, Vendor, Order

def seed_data():
    db.session.query(Order).delete()
    db.session.query(Vendor).delete()
    db.session.query(User).delete()
    db.session.query(Admin).delete()

    admin1 = Admin(username='admin1', password='adminpass1')
    admin2 = Admin(username='admin2', password='adminpass2')

    user1 = User(username='alice', password='alicepass')
    user2 = User(username='bob', password='bobpass')

    db.session.add_all([admin1, admin2, user1, user2])
    db.session.commit()
    
    vendor1 = Vendor(name='Pizza Palace')
    vendor2 = Vendor(name='Burger Barn')

    db.session.add_all([vendor1, vendor2])
    db.session.commit()

    order1 = Order(user_id=user1.id, vendor_id=vendor1.id, product_name='Pepperoni Pizza', quantity=2, status='pending')
    order2 = Order(user_id=user2.id, vendor_id=vendor2.id, product_name='Cheeseburger', quantity=1, status='completed')

    db.session.add_all([order1, order2])
    db.session.commit()