class CreateBulletinReads < ActiveRecord::Migration[7.2]
  def change
    create_table :bulletin_reads do |t|
      t.references :bulletin, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :registration_email
      t.datetime :read_at

      t.timestamps
    end

    # Unique constraint for authenticated users
    add_index :bulletin_reads, [ :bulletin_id, :user_id ],
              unique: true,
              where: "user_id IS NOT NULL",
              name: "index_bulletin_reads_on_bulletin_and_user"

    # Unique constraint for guest vendors (by email)
    add_index :bulletin_reads, [ :bulletin_id, :registration_email ],
              unique: true,
              where: "registration_email IS NOT NULL",
              name: "index_bulletin_reads_on_bulletin_and_email"
  end
end
